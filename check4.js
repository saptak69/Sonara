fetch('https://www.jiosaavn.com/api.php?_format=json&__call=playlist.getDetails&listid=1582205')
  .then(r => r.json())
  .then(json => {
    const rawSongs = json.list || json.songs || [];
    const tracks = rawSongs.filter(s => Boolean(s.id && s.encrypted_media_url));
    console.log(`Songs length: ${rawSongs.length}, valid tracks length: ${tracks.length}`);
  });
