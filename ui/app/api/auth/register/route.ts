import { type NextRequest, NextResponse } from 'next/server';

// In-memory storage for demo purposes
// In production, use a proper database
const users: { username: string; password: string }[] = [];

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Validation
    if (!username) {
      return NextResponse.json(
        { message: 'Username is required' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { message: 'Password is required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password too weak' },
        { status: 400 }
      );
    }

    if (username.length > 50) {
      return NextResponse.json(
        { message: 'Username too long' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = users.find((user) => user.username === username);
    if (existingUser) {
      return NextResponse.json(
        { message: 'Username already exists' },
        { status: 409 }
      );
    }

    // Create user (in production, hash the password)
    users.push({ username, password });

    return NextResponse.json(
      { message: 'Registration successful' },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
