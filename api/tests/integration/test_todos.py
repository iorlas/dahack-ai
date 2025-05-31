from fastapi import status


def test_create_todo(test_client):
    todo_data = {"title": "Test Todo", "description": "Test Description", "completed": False}

    response = test_client.post("/v1/todos", json=todo_data)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["title"] == todo_data["title"]
    assert data["description"] == todo_data["description"]
    assert data["completed"] == todo_data["completed"]
    assert "id" in data


def test_list_todos(test_client):
    # Create a test todo using API
    todo_data = {"title": "Test Todo", "description": "Test Description", "completed": False}
    create_response = test_client.post("/v1/todos", json=todo_data)
    assert create_response.status_code == status.HTTP_201_CREATED
    created_todo = create_response.json()

    response = test_client.get("/v1/todos")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["title"] == created_todo["title"]


def test_get_todo(test_client):
    # Create a test todo using API
    todo_data = {"title": "Test Todo", "description": "Test Description", "completed": False}
    create_response = test_client.post("/v1/todos", json=todo_data)
    assert create_response.status_code == status.HTTP_201_CREATED
    created_todo = create_response.json()

    response = test_client.get(f"/v1/todos/{created_todo['id']}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == created_todo["id"]
    assert data["title"] == created_todo["title"]


def test_update_todo(test_client):
    # Create a test todo using API
    todo_data = {"title": "Test Todo", "description": "Test Description", "completed": False}
    create_response = test_client.post("/v1/todos", json=todo_data)
    assert create_response.status_code == status.HTTP_201_CREATED
    created_todo = create_response.json()

    update_data = {"title": "Updated Todo", "completed": True}

    response = test_client.patch(f"/v1/todos/{created_todo['id']}", json=update_data)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == update_data["title"]
    assert data["completed"] == update_data["completed"]


def test_delete_todo(test_client):
    # Create a test todo using API
    todo_data = {"title": "Test Todo", "description": "Test Description", "completed": False}
    create_response = test_client.post("/v1/todos", json=todo_data)
    assert create_response.status_code == status.HTTP_201_CREATED
    created_todo = create_response.json()

    response = test_client.delete(f"/v1/todos/{created_todo['id']}")
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Verify todo is deleted
    response = test_client.get(f"/v1/todos/{created_todo['id']}")
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_get_nonexistent_todo(test_client):
    response = test_client.get("/v1/todos/-1")
    assert response.status_code == status.HTTP_404_NOT_FOUND
