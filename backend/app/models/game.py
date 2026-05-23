from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Game(Base):
    __tablename__ = "games"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    status: Mapped[str] = mapped_column(String(30), default="waiting", nullable=False)
    current_fen: Mapped[str] = mapped_column(String(120), nullable=False)
    turn_color: Mapped[str] = mapped_column(String(10), default="white", nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    result: Mapped[str | None] = mapped_column(String(30), nullable=True)

    players = relationship("GamePlayer", back_populates="game", cascade="all, delete-orphan")
    moves = relationship("Move", back_populates="game", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="game", cascade="all, delete-orphan")
