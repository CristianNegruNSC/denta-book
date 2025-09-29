"""add service_id to appointments

Revision ID: 9e91788a05ff
Revises: 6bd96df8964c
Create Date: 2025-09-29 21:03:20.248189

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9e91788a05ff'
down_revision: Union[str, Sequence[str], None] = '6bd96df8964c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column(
        "appointments",
        sa.Column("service_id", sa.Integer, sa.ForeignKey("services.id", ondelete="SET NULL")),
    )


def downgrade():
    op.drop_column("appointments", "service_id")