import yaml
from fastapi.openapi.utils import get_openapi

from app.main import app


def generate_openapi_yaml():
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description if hasattr(app, "description") else None,
        routes=app.routes,
    )

    with open("openapi.yaml", "w") as f:
        yaml.dump(openapi_schema, f, sort_keys=False)

    print("OpenAPI specification has been written to openapi.yaml")


if __name__ == "__main__":
    generate_openapi_yaml()
