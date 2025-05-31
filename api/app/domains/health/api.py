from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/healthz")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
