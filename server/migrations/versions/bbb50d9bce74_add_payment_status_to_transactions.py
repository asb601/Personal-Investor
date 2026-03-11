"""add_payment_status_to_transactions

Revision ID: bbb50d9bce74
Revises: 59b7f904137e
Create Date: 2026-03-12 00:55:02.444741

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bbb50d9bce74'
down_revision: Union[str, Sequence[str], None] = '59b7f904137e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create the enum type in Postgres first, then add the column
    payment_status_enum = sa.Enum('pending', 'confirmed', 'manual', name='paymentstatusenum')
    payment_status_enum.create(op.get_bind(), checkfirst=True)
    op.add_column('transactions', sa.Column('payment_status', payment_status_enum, server_default='manual', nullable=False))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('transactions', 'payment_status')
    sa.Enum(name='paymentstatusenum').drop(op.get_bind(), checkfirst=True)
