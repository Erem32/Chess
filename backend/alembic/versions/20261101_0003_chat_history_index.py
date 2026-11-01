"""index chat messages for bounded game history

Revision ID: 20261101_0003
Revises: 20260620_0002
"""
from alembic import op


revision = "20261101_0003"
down_revision = "20260620_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index("ix_chat_messages_game_id_id", "chat_messages", ["game_id", "id"])


def downgrade() -> None:
    op.drop_index("ix_chat_messages_game_id_id", table_name="chat_messages")
