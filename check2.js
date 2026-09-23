fetch('https://www.jiosaavn.com/api.php?_format=json&__call=playlist.getDetails&listid=1582205').then(r=>r.json()).then(j=>console.log(Object.keys(j.songs?.[0] || {})))
