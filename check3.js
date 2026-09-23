fetch('https://www.jiosaavn.com/api.php?_format=json&__call=playlist.getDetails&listid=1582205').then(r=>r.json()).then(j=>console.log('root keys:', Object.keys(j), 'id:', j.id, 'listid:', j.listid))
