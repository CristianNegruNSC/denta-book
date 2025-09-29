"""refactor services schema

Revision ID: 28a583d12fea
Revises: f00e5cc0bb19
Create Date: 2025-09-29 19:10:06.881563

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '28a583d12fea'
down_revision: Union[str, Sequence[str], None] = 'f00e5cc0bb19'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # 1. Creăm tabelul services (unic, doar nume)
    op.create_table(
        'services',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String, nullable=False, unique=True),
    )

    # 2. Creăm tabel pivot provider_services
    op.create_table(
        'provider_services',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('provider_id', sa.Integer, sa.ForeignKey('users.id')),
        sa.Column('service_id', sa.Integer, sa.ForeignKey('services.id')),
        sa.Column('price', sa.Float, nullable=True, server_default="0"),
        sa.Column('duration_minutes', sa.Integer, nullable=True, server_default="30"),
    )

    # 3. Populăm tabelul services cu DEFAULT_SERVICES
    default_services = [
        "Consultatie",
        "Igienizari",
        "Tratament de canal",
        "Obturatii",
        "Proteze fixe",
        "Proteze mobilizabile",
        "Proteze mobile",
        "Implanturi",
        "Radiografii",
        "CBCT",
        "Aparte ortodontice",
    ]
    conn = op.get_bind()
    for name in default_services:
        conn.execute(sa.text("INSERT INTO services (name) VALUES (:name)"), {"name": name})


def downgrade():
    op.drop_table('provider_services')
    op.drop_table('services')