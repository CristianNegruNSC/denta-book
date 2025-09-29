"""add service_id to appointments

Revision ID: 7a71c893086d
Revises: 9e91788a05ff
Create Date: 2025-09-29 21:08:11.969355

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7a71c893086d'
down_revision: Union[str, Sequence[str], None] = '9e91788a05ff'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column(
        "appointments",
        sa.Column("service_id", sa.Integer, sa.ForeignKey("services.id", ondelete="SET NULL"), nullable=True)
    )

def downgrade():
    op.drop_column("appointments", "service_id")
