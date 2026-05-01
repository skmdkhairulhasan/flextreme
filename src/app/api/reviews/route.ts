import { NextRequest, NextResponse } from "next/server"

// TEMP in-memory reviews (replace with your database later)
const reviews = [
  {
    id: "1",
    product_id: "1",
    product_name: "Compression Tank",
    customer_name: "Ahmed Khan",
    customer_location: "Dhaka",
    rating: 5,
    review_text: "Perfect fit and amazing quality. The compression is just right!",
    photo_url: null,
    status: "approved",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    product_id: "2",
    product_name: "Training Shorts",
    customer_name: "Rafiq Ahmed",
    customer_location: "Chittagong",
    rating: 5,
    review_text: "Best gym wear I've ever bought. Highly recommended!",
    photo_url: null,
    status: "approved",
    created_at: new Date().toISOString(),
  },
]

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const limit = searchParams.get("limit")
    const productId = searchParams.get("product_id")

    let filtered = reviews

    if (status) {
      filtered = filtered.filter(r => r.status === status)
    }

    if (productId) {
      filtered = filtered.filter(r => r.product_id === productId)
    }

    if (limit) {
      filtered = filtered.slice(0, parseInt(limit))
    }

    return NextResponse.json({ reviews: filtered })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const newReview = {
      id: String(reviews.length + 1),
      ...body,
      status: "pending",
      created_at: new Date().toISOString(),
    }

    reviews.push(newReview)

    return NextResponse.json({ review: newReview })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    const reviewIndex = reviews.findIndex(r => r.id === id)

    if (reviewIndex === -1) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      )
    }

    reviews[reviewIndex] = {
      ...reviews[reviewIndex],
      ...updates,
      updated_at: new Date().toISOString()
    }

    return NextResponse.json({ review: reviews[reviewIndex] })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Review ID required" },
        { status: 400 }
      )
    }

    const reviewIndex = reviews.findIndex(r => r.id === id)

    if (reviewIndex === -1) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      )
    }

    reviews.splice(reviewIndex, 1)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    )
  }
}
