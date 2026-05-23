from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class GamePlayer(Base):
    __tablename__ = "game_players"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    color: Mapped[str] = mapped_column(String(10), nullable=False)
    result: Mapped[str | None] = mapped_column(String(30), nullable=True)

    game = relationship("Game", back_populates="players")
    user = relationship("User", back_populates="games")
