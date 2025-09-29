"""add created_by column to appointments

Revision ID: 6bd96df8964c
Revises: 65f5f29a0382
Create Date: 2025-09-29 20:37:35.701792

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6bd96df8964c'
down_revision: Union[str, Sequence[str], None] = '65f5f29a0382'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column(
        "appointments",
        sa.Column("created_by", sa.String(), server_default="client", nullable=False),
    )


def downgrade():
    op.drop_column("appointments", "created_by")
