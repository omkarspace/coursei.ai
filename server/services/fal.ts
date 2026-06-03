export interface BannerGenerationOptions {
  courseName: string;
  category: string;
  style?: "modern" | "minimal" | "vibrant" | "professional";
}

export async function generateCourseBanner(
  options: BannerGenerationOptions
): Promise<string | null> {
  const { courseName, category, style = "modern" } = options;

  // Check if FAL_KEY is configured
  if (!process.env.FAL_KEY) {
    console.warn("FAL_KEY not configured, skipping banner generation");
    return null;
  }

  const stylePrompts = {
    modern: "modern, clean, minimalist design with abstract shapes",
    minimal: "minimalist, simple, elegant design with subtle gradients",
    vibrant: "vibrant, colorful, energetic design with dynamic elements",
    professional: "professional, corporate, sophisticated design",
  };

  const prompt = `Professional course banner for "${courseName}" in the ${category} category. ${stylePrompts[style]}. Educational theme with relevant icons and typography. High quality, 16:9 aspect ratio.`;

  try {
    // Use fetch to call Fal.ai API directly
    const response = await fetch("https://fal.run/fal-ai/flux/dev", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${process.env.FAL_KEY}`,
      },
      body: JSON.stringify({
        prompt,
        image_size: "landscape_16_9",
        num_images: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Fal.ai API error: ${response.statusText}`);
    }

    const result = await response.json();

    // Return the first image URL
    if (result.images && result.images.length > 0) {
      return result.images[0].url;
    }

    return null;
  } catch (error) {
    console.error("Error generating banner with Fal.ai:", error);
    return null;
  }
}

export async function generateChapterIllustration(
  chapterName: string,
  courseName: string
): Promise<string | null> {
  if (!process.env.FAL_KEY) {
    return null;
  }

  const prompt = `Educational illustration for "${chapterName}" chapter in "${courseName}" course. Clean, modern, informative visual style. High quality illustration.`;

  try {
    const response = await fetch("https://fal.run/fal-ai/flux/dev", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${process.env.FAL_KEY}`,
      },
      body: JSON.stringify({
        prompt,
        image_size: "landscape_16_9",
        num_images: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Fal.ai API error: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.images && result.images.length > 0) {
      return result.images[0].url;
    }

    return null;
  } catch (error) {
    console.error("Error generating illustration with Fal.ai:", error);
    return null;
  }
}
