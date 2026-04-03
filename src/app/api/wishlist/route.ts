import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/wishlist — returns all saved properties for the logged-in user
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("wishlist")
      .select("*")
      .eq("user_id", user.id)
      .order("added_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (err) {
    console.error("Wishlist GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/wishlist — add a property to wishlist
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { propertyId, propertyName, area, city, price, photoUrl } = body;

    if (!propertyId) {
      return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("wishlist")
      .upsert({
        user_id: user.id,
        property_id: propertyId,
        property_name: propertyName || null,
        area: area || null,
        city: city || null,
        price: price || null,
        photo_url: photoUrl || null,
      }, { onConflict: "user_id,property_id" })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: "Added to wishlist", item: data });
  } catch (err) {
    console.error("Wishlist POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/wishlist — remove a property from wishlist
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { propertyId } = await req.json();
    if (!propertyId) {
      return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("wishlist")
      .delete()
      .eq("user_id", user.id)
      .eq("property_id", propertyId);

    if (error) throw error;

    return NextResponse.json({ message: "Removed from wishlist" });
  } catch (err) {
    console.error("Wishlist DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
