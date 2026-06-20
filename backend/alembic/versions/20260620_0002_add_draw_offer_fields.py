"""add draw offer fields

Revision ID: 20260620_0002
Revises: 20260523_0001
Create Date: 2026-06-20
"""
from alembic import op
import sqlalchemy as sa


revision = "20260620_0002"
down_revision = "20260523_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("games", sa.Column("draw_offer_by_user_id", sa.Integer(), nullable=True))
    op.add_column("games", sa.Column("draw_offer_created_at", sa.DateTime(), nullable=True))
    op.create_foreign_key(
        "fk_games_draw_offer_by_user_id_users",
        "games",
        "users",
        ["draw_offer_by_user_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_games_draw_offer_by_user_id_users", "games", type_="foreignkey")
    op.drop_column("games", "draw_offer_created_at")
    op.drop_column("games", "draw_offer_by_user_id")
