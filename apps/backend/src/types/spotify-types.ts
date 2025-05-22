declare namespace SpotifyApi {
    interface ExternalUrlObject {
      spotify: string;
    }
  
    interface ImageObject {
      height: number;
      url: string;
      width: number;
    }
  
    interface ArtistObjectSimplified {
      external_urls: ExternalUrlObject;
      href: string;
      id: string;
      name: string;
      type: 'artist';
      uri: string;
    }
  
    interface AlbumObjectSimplified {
      album_group?: string;
      album_type: string;
      artists: ArtistObjectSimplified[];
      available_markets: string[];
      external_urls: ExternalUrlObject;
      href: string;
      id: string;
      images: ImageObject[];
      name: string;
      release_date: string;
      release_date_precision: string;
      total_tracks: number;
      type: 'album';
      uri: string;
    }
  
    interface TrackObjectFull {
      album: AlbumObjectSimplified;
      artists: ArtistObjectSimplified[];
      available_markets: string[];
      disc_number: number;
      duration_ms: number;
      explicit: boolean;
      external_ids: {
        isrc?: string;
        ean?: string;
        upc?: string;
      };
      external_urls: ExternalUrlObject;
      href: string;
      id: string;
      is_local: boolean;
      name: string;
      popularity: number;
      preview_url: string | null;
      track_number: number;
      type: 'track';
      uri: string;
    }
  
    interface AlbumObjectFull extends AlbumObjectSimplified {
      tracks: {
        href: string;
        items: TrackObjectFull[];
        limit: number;
        next: string | null;
        offset: number;
        previous: string | null;
        total: number;
      };
      copyrights: {
        text: string;
        type: string;
      }[];
      external_ids: {
        upc?: string;
        ean?: string;
        isrc?: string;
      };
      genres: string[];
      label: string;
      popularity: number;
    }
  
    interface PagingObject<T> {
      href: string;
      items: T[];
      limit: number;
      next: string | null;
      offset: number;
      previous: string | null;
      total: number;
    }
  
    interface SearchResponse {
      albums?: PagingObject<AlbumObjectSimplified>;
      artists?: PagingObject<ArtistObjectSimplified>;
      tracks?: PagingObject<TrackObjectFull>;
    }
  
    interface TrackSearchResponse extends SearchResponse {
      tracks: PagingObject<TrackObjectFull>;
    }
  
    interface AlbumSearchResponse extends SearchResponse {
      albums: PagingObject<AlbumObjectSimplified>;
    }
  
    interface PlayHistoryObject {
      track: TrackObjectFull;
      played_at: string;
      context: {
        type: string;
        href: string;
        external_urls: ExternalUrlObject;
        uri: string;
      } | null;
    }
  
    interface RecommendationsObject {
      tracks: TrackObjectFull[];
      seeds: {
        afterFilteringSize: number;
        afterRelinkingSize: number;
        href: string;
        id: string;
        initialPoolSize: number;
        type: string;
      }[];
    }
  }