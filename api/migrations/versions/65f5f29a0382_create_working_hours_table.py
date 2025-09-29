"""create working_hours table

Revision ID: 65f5f29a0382
Revises: daa547f52bd8
Create Date: 2025-09-29 20:29:26.849359

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '65f5f29a0382'
down_revision: Union[str, Sequence[str], None] = 'daa547f52bd8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade():
    op.create_table(
        "working_hours",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("provider_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("day_of_week", sa.Integer, nullable=False),
        sa.Column("start_time", sa.Time, nullable=False),
        sa.Column("end_time", sa.Time, nullable=False),
    )

def downgrade():
    op.drop_table("working_hours")