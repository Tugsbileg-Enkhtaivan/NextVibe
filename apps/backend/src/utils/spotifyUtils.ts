export function isTrackSearchResponse(
    response: SpotifyApi.SearchResponse
  ): response is SpotifyApi.TrackSearchResponse {
    return !!response.tracks;
  }
  
  export function isAlbumSearchResponse(
    response: SpotifyApi.SearchResponse
  ): response is SpotifyApi.AlbumSearchResponse {
    return !!response.albums;
  }
  