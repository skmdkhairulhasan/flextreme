import { NextRequest, NextResponse } from "next/server"

// TEMP in-memory products (starts empty!)
let products: any[] = []

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const featured = searchParams.get("featured")
    const limit = searchParams.get("limit")
    const inStock = searchParams.get("in_stock")
    const id = searchParams.get("id")

    let result = [...products]

    // Filter by ID
    if (id) {
      result = result.filter(p => p.id === id)
    }

    // Filter featured
    if (featured === "true") {
      result = result.filter(p => p.is_featured === true)
    }

    // Filter in stock
    if (inStock === "true") {
      result = result.filter(p => p.in_stock !== false)
    }

    // Limit results
    if (limit) {
      result = result.slice(0, Number(limit))
    }

    return NextResponse.json({
      products: result,
    })
  } catch (error) {
    console.error("Products API error:", error)

    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const newProduct = {
      id: crypto.randomUUID(),
      name: body.name,
      slug: body.slug,
      price: body.price,
      original_price: body.original_price,
      category: body.category,
      subcategory: body.subcategory,
      sizes: body.sizes || [],
      colors: body.colors || [],
      images: body.images || [],
      video_url: body.video_url,
      description: body.description || "",
      is_featured: body.is_featured || false,
      in_stock: body.in_stock ?? true,
      stock_quantity: body.stock_quantity,
      low_stock_alert: body.low_stock_alert || 5,
      stock_matrix: body.stock_matrix || {},
      created_at: new Date().toISOString(),
    }

    products.unshift(newProduct)

    return NextResponse.json({
      success: true,
      product: newProduct,
    })
  } catch (error) {
    console.error("Create product error:", error)

    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updates } = body

    const productIndex = products.findIndex(p => p.id === id)

    if (productIndex === -1) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    products[productIndex] = {
      ...products[productIndex],
      ...updates,
      updated_at: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      product: products[productIndex]
    })
  } catch (error) {
    console.error("Update product error:", error)

    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Product ID required" },
        { status: 400 }
      )
    }

    const productIndex = products.findIndex(p => p.id === id)

    if (productIndex === -1) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    products.splice(productIndex, 1)

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error("Delete product error:", error)

    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    )
  }
}
