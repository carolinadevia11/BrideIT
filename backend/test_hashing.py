from passlib.context import CryptContext
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_hashing():
    logger.info("Initializing CryptContext...")
    try:
        pwd_context = CryptContext(
            schemes=["bcrypt_sha256", "bcrypt"],
            default="bcrypt_sha256",
            deprecated="auto",
        )
        logger.info("CryptContext initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize CryptContext: {e}")
        return

    password = "testpassword123"
    logger.info(f"Testing hashing for password: {password}")

    try:
        hashed = pwd_context.hash(password)
        logger.info(f"Hashed password: {hashed}")
    except Exception as e:
        logger.error(f"Hashing failed: {e}")
        return

    logger.info("Testing verification...")
    try:
        is_valid = pwd_context.verify(password, hashed)
        logger.info(f"Verification result: {is_valid}")
        
        if is_valid:
            logger.info("SUCCESS: Password hashing and verification working correctly.")
        else:
            logger.error("FAILURE: Password verification returned False.")
            
    except Exception as e:
        logger.error(f"Verification failed: {e}")

if __name__ == "__main__":
    test_hashing()