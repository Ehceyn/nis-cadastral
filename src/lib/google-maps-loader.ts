// lib/google-maps-loader.ts
import { Loader } from "@googlemaps/js-api-loader";

class GoogleMapsLoader {
  private static instance: GoogleMapsLoader;
  private loader: Loader | null = null;
  private isLoaded = false;
  private isLoading = false;
  private loadPromise: Promise<any> | null = null;

  private constructor() {}

  public static getInstance(): GoogleMapsLoader {
    if (!GoogleMapsLoader.instance) {
      GoogleMapsLoader.instance = new GoogleMapsLoader();
    }
    return GoogleMapsLoader.instance;
  }

  public async load(): Promise<any> {
    if (this.isLoaded) {
      return window.google;
    }

    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error("Google Maps API key not configured");
    }

    // Create loader only once with all required libraries
    if (!this.loader) {
      this.loader = new Loader({
        apiKey,
        version: "weekly",
        libraries: ["maps", "places", "geometry", "marker"],
      });
    }

    this.isLoading = true;
    this.loadPromise = this.loader
      .load()
      .then(() => {
        this.isLoaded = true;
        this.isLoading = false;
        return window.google;
      })
      .catch((error) => {
        this.isLoading = false;
        this.loadPromise = null;
        throw error;
      });

    return this.loadPromise;
  }

  public isGoogleMapsLoaded(): boolean {
    return this.isLoaded;
  }
}

export const googleMapsLoader = GoogleMapsLoader.getInstance();
