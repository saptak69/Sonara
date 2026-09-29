process.on('unhandledRejection', (reason) => { 
  console.log('unhandled', reason); 
}); 
import('./.vercel/output/functions/__server.func/index.mjs')
  .then(r => console.log('Success'))
  .catch(e => { 
    console.log('CAUGHT:', e); 
    console.log(e.stack); 
  });
