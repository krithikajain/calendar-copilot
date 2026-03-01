import datetime
from app.database import Contact, SessionLocal

def get_contact_db():
    return SessionLocal()

def lookup_contact_email(name: str):
    db = get_contact_db()
    try:
        contact = db.query(Contact).filter(Contact.name.ilike(name)).first()
        return contact.email if contact else None
    finally:
        db.close()

def upsert_contact_email(name: str, email: str):
    db = get_contact_db()
    try:
        contact = db.query(Contact).filter(Contact.name.ilike(name)).first()
        if contact:
            contact.email = email
            contact.updated_at = datetime.datetime.utcnow().isoformat()
        else:
            contact = Contact(name=name, email=email, updated_at=datetime.datetime.utcnow().isoformat())
            db.add(contact)
        db.commit()
    finally:
        db.close()
