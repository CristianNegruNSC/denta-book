"""add working_hours table

Revision ID: daa547f52bd8
Revises: 28a583d12fea
Create Date: 2025-09-29 20:12:09.696365

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'daa547f52bd8'
down_revision: Union[str, Sequence[str], None] = '28a583d12fea'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
