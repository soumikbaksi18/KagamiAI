from sqlmodel import SQLModel, create_engine, Session
from app.config import DB_URL

engine = create_engine(DB_URL, echo=False)

def init_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
