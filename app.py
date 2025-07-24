from config import DevelopmentConfig, ProductionConfig
import os

if os.environ.get("FLASK_ENV") == "development":
    app.config.from_object(DevelopmentConfig)
else:
    app.config.from_object(ProductionConfig)