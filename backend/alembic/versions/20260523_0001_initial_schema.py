"""initial schema

Revision ID: 20260523_0001
Revises:
Create Date: 2026-05-23
"""
from alembic import op
import sqlalchemy as sa


revision = "20260523_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "games",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("current_fen", sa.String(length=120), nullable=False),
        sa.Column("turn_color", sa.String(length=10), nullable=False),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("finished_at", sa.DateTime(), nullable=True),
        sa.Column("result", sa.String(length=30), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_games_id"), "games", ["id"], unique=False)

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("is_admin", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)

    op.create_table(
        "chat_messages",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("game_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["game_id"], ["games.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_chat_messages_game_id"), "chat_messages", ["game_id"], unique=False)
    op.create_index(op.f("ix_chat_messages_id"), "chat_messages", ["id"], unique=False)
    op.create_index(op.f("ix_chat_messages_user_id"), "chat_messages", ["user_id"], unique=False)

    op.create_table(
        "game_players",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("game_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("color", sa.String(length=10), nullable=False),
        sa.Column("result", sa.String(length=30), nullable=True),
        sa.ForeignKeyConstraint(["game_id"], ["games.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_game_players_game_id"), "game_players", ["game_id"], unique=False)
    op.create_index(op.f("ix_game_players_id"), "game_players", ["id"], unique=False)
    op.create_index(op.f("ix_game_players_user_id"), "game_players", ["user_id"], unique=False)

    op.create_table(
        "matchmaking_queue",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_matchmaking_queue_id"), "matchmaking_queue", ["id"], unique=False)
    op.create_index(op.f("ix_matchmaking_queue_user_id"), "matchmaking_queue", ["user_id"], unique=True)

    op.create_table(
        "moves",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("game_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("move_number", sa.Integer(), nullable=False),
        sa.Column("move_uci", sa.String(length=10), nullable=False),
        sa.Column("move_san", sa.String(length=20), nullable=True),
        sa.Column("fen_after_move", sa.String(length=120), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["game_id"], ["games.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_moves_game_id"), "moves", ["game_id"], unique=False)
    op.create_index(op.f("ix_moves_id"), "moves", ["id"], unique=False)
    op.create_index(op.f("ix_moves_user_id"), "moves", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_moves_user_id"), table_name="moves")
    op.drop_index(op.f("ix_moves_id"), table_name="moves")
    op.drop_index(op.f("ix_moves_game_id"), table_name="moves")
    op.drop_table("moves")
    op.drop_index(op.f("ix_matchmaking_queue_user_id"), table_name="matchmaking_queue")
    op.drop_index(op.f("ix_matchmaking_queue_id"), table_name="matchmaking_queue")
    op.drop_table("matchmaking_queue")
    op.drop_index(op.f("ix_game_players_user_id"), table_name="game_players")
    op.drop_index(op.f("ix_game_players_id"), table_name="game_players")
    op.drop_index(op.f("ix_game_players_game_id"), table_name="game_players")
    op.drop_table("game_players")
    op.drop_index(op.f("ix_chat_messages_user_id"), table_name="chat_messages")
    op.drop_index(op.f("ix_chat_messages_id"), table_name="chat_messages")
    op.drop_index(op.f("ix_chat_messages_game_id"), table_name="chat_messages")
    op.drop_table("chat_messages")
    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
    op.drop_index(op.f("ix_games_id"), table_name="games")
    op.drop_table("games")
