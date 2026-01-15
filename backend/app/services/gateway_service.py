"""
API Gateway Service
Proxy requests to vendor endpoints
"""
import time
from typing import Any, Dict, Optional, Tuple
from uuid import UUID

import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.api import Api, Subscription
from app.models.user import Buyer
from app.models.key import ApiKey
from app.models.transaction import UsageStatus
from app.services.billing_service import BillingService


class GatewayService:
    """API Gateway service for proxying requests to vendor endpoints."""
    
    # HTTP client timeout configuration
    TIMEOUT = httpx.Timeout(30.0, connect=10.0)
    
    @classmethod
    async def validate_request(
        cls,
        db: AsyncSession,
        api_id: UUID,
        buyer: Buyer,
        api_key: ApiKey
    ) -> Tuple[bool, str, Optional[Api]]:
        """
        Validate an API request.
        Returns: (is_valid, error_message, api)
        """
        # 1. Check if API exists and is active
        result = await db.execute(
            select(Api).where(Api.id == api_id, Api.is_active == True)
        )
        api = result.scalar_one_or_none()
        
        if not api:
            return False, "API not found or inactive", None
        
        # 2. Check if buyer has an active subscription
        sub_result = await db.execute(
            select(Subscription).where(
                Subscription.api_id == api_id,
                Subscription.buyer_id == buyer.id,
                Subscription.is_active == True
            )
        )
        subscription = sub_result.scalar_one_or_none()
        
        if not subscription:
            return False, "No active subscription for this API", None
        
        # 3. Check if buyer has sufficient credits
        has_credits = await BillingService.check_sufficient_credits(
            db, buyer.id, float(api.price_per_call)
        )
        
        if not has_credits:
            return False, "Insufficient credits", None
        
        return True, "", api
    
    @classmethod
    async def proxy_request(
        cls,
        api: Api,
        method: str,
        payload: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None
    ) -> Tuple[UsageStatus, Optional[Dict[str, Any]], Optional[str], float]:
        """
        Proxy a request to the vendor's real endpoint.
        Returns: (status, response_data, error_message, response_time_ms)
        """
        start_time = time.time()
        
        try:
            async with httpx.AsyncClient(timeout=cls.TIMEOUT) as client:
                # Prepare headers - only keep minimal required headers
                # Remove headers that could cause issues with re-serialized body
                proxy_headers = {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                }
                
                # Make the request
                if method.upper() == "GET":
                    response = await client.get(
                        api.real_endpoint,
                        headers=proxy_headers,
                        params=payload
                    )
                else:
                    response = await client.post(
                        api.real_endpoint,
                        headers=proxy_headers,
                        json=payload
                    )
                
                response_time = (time.time() - start_time) * 1000  # ms
                
                if response.status_code >= 200 and response.status_code < 300:
                    try:
                        response_data = response.json()
                    except:
                        response_data = {"response": response.text}
                    
                    return UsageStatus.SUCCESS, response_data, None, response_time
                else:
                    return (
                        UsageStatus.FAILED,
                        None,
                        f"Vendor API returned status {response.status_code}",
                        response_time
                    )
                    
        except httpx.TimeoutException:
            response_time = (time.time() - start_time) * 1000
            return UsageStatus.TIMEOUT, None, "Request timed out", response_time
            
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return UsageStatus.FAILED, None, str(e), response_time
    
    @classmethod
    async def execute_api_call(
        cls,
        db: AsyncSession,
        api_id: UUID,
        buyer: Buyer,
        api_key: ApiKey,
        method: str = "POST",
        payload: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Execute a full API call through the gateway.
        Returns: (success, response_or_error)
        """
        # 1. Validate request
        is_valid, error_msg, api = await cls.validate_request(
            db, api_id, buyer, api_key
        )
        
        if not is_valid:
            return False, {"error": error_msg}
        
        # 2. Proxy the request
        status, response_data, error_message, response_time = await cls.proxy_request(
            api, method, payload, headers
        )
        
        # 3. Process billing
        await BillingService.process_api_call_billing(
            db=db,
            api=api,
            buyer_id=buyer.id,
            api_key_id=api_key.id,
            status=status,
            response_time_ms=response_time,
            error_message=error_message
        )
        
        # 4. Return response
        if status == UsageStatus.SUCCESS:
            return True, {
                "data": response_data,
                "meta": {
                    "credits_used": float(api.price_per_call),
                    "response_time_ms": round(response_time, 2)
                }
            }
        else:
            return False, {
                "error": error_message,
                "status": status.value,
                "response_time_ms": round(response_time, 2)
            }
