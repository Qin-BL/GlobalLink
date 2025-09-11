"""
会员管理端点
"""
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ...api.deps import get_current_active_user, get_db
from ...models import User, Membership
from ...schemas import MembershipCreate, MembershipUpdate, MembershipResponse

router = APIRouter()

@router.get("/", response_model=List[MembershipResponse])
def get_memberships(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    获取会员列表
    """
    memberships = db.query(Membership).offset(skip).limit(limit).all()
    return memberships

@router.post("/", response_model=MembershipResponse)
def create_membership(
    *,
    db: Session = Depends(get_db),
    membership_in: MembershipCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    创建新会员
    """
    membership = Membership(**membership_in.dict())
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership

@router.get("/{membership_id}", response_model=MembershipResponse)
def get_membership(
    *,
    db: Session = Depends(get_db),
    membership_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    获取特定会员
    """
    membership = db.query(Membership).filter(Membership.id == membership_id).first()
    if not membership:
        raise HTTPException(status_code=404, detail="会员不存在")
    return membership

@router.put("/{membership_id}", response_model=MembershipResponse)
def update_membership(
    *,
    db: Session = Depends(get_db),
    membership_id: int,
    membership_in: MembershipUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    更新会员
    """
    membership = db.query(Membership).filter(Membership.id == membership_id).first()
    if not membership:
        raise HTTPException(status_code=404, detail="会员不存在")
    
    update_data = membership_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(membership, field, value)
    
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership

@router.delete("/{membership_id}")
def delete_membership(
    *,
    db: Session = Depends(get_db),
    membership_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    删除会员
    """
    membership = db.query(Membership).filter(Membership.id == membership_id).first()
    if not membership:
        raise HTTPException(status_code=404, detail="会员不存在")
    
    db.delete(membership)
    db.commit()
    return {"message": "会员删除成功"}