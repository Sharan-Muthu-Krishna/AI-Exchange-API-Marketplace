"""
API Gateway Router
Proxy endpoint for API calls
"""
from typing import Any, Dict, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import Buyer
from app.models.key import ApiKey
from app.utils.dependencies import get_api_key_user
from app.services.gateway_service import GatewayService


router = APIRouter(prefix="/v1", tags=["Gateway"])


@router.post("/apis/{api_id}/run")
async def execute_api(
    api_id: UUID,
    request: Request,
    payload: Optional[Dict[str, Any]] = None,
    auth: tuple = Depends(get_api_key_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Execute an API through the gateway.
    
    This is the main endpoint buyers use to call vendor APIs.
    
    - Validates API key
    - Checks subscription
    - Verifies credits
    - Proxies request to vendor
    - Handles billing
    - Returns response
    """
    api_key, buyer = auth
    
    # Get headers (for potential forwarding)
    headers = dict(request.headers)
    
    # Execute the API call
    success, result = await GatewayService.execute_api_call(
        db=db,
        api_id=api_id,
        buyer=buyer,
        api_key=api_key,
        method="POST",
        payload=payload,
        headers=headers
    )
    
    if not success:
        # Determine appropriate status code
        error_msg = result.get("error", "")
        
        if "not found" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result
            )
        elif "subscription" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=result
            )
        elif "credits" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=result
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=result
            )
    
    return result


@router.get("/apis/{api_id}/run")
async def execute_api_get(
    api_id: UUID,
    request: Request,
    auth: tuple = Depends(get_api_key_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Execute an API through the gateway (GET method).
    Query parameters are forwarded to the vendor API.
    """
    api_key, buyer = auth
    
    # Convert query params to dict
    params = dict(request.query_params)
    headers = dict(request.headers)
    
    success, result = await GatewayService.execute_api_call(
        db=db,
        api_id=api_id,
        buyer=buyer,
        api_key=api_key,
        method="GET",
        payload=params,
        headers=headers
    )
    
    if not success:
        error_msg = result.get("error", "")
        
        if "not found" in error_msg.lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result)
        elif "subscription" in error_msg.lower():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=result)
        elif "credits" in error_msg.lower():
            raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail=result)
        else:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=result)
    
    return result
