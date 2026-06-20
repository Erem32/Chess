from app.core.config import settings
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models import User


DEV_USERS = [
    {
        "username": "123",
        "email": "123@123.pl",
        "password": "123",
    },
    {
        "username": "321",
        "email": "321@321.pl",
        "password": "321",
    },
]


def seed_dev_users() -> None:
    if not settings.enable_dev_seed_users:
        print("Development user seeding disabled.")
        return

    with SessionLocal() as db:
        for dev_user in DEV_USERS:
            user = db.query(User).filter(User.email == dev_user["email"]).one_or_none()
            hashed_password = hash_password(dev_user["password"])

            if user is None:
                user = User(
                    username=dev_user["username"],
                    email=dev_user["email"],
                    hashed_password=hashed_password,
                    is_active=True,
                )
                db.add(user)
                continue

            user.username = dev_user["username"]
            user.hashed_password = hashed_password
            user.is_active = True

        db.commit()

    print("Development users seeded: 123@123.pl, 321@321.pl")


if __name__ == "__main__":
    seed_dev_users()
