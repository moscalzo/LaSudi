//import { ArtilcesReader } from './reader.js';
import { reader2 } from './reader2.0.js';

for (let val of await reader2.serializeAllArticlesPagesByDate(new Date())) {
    console.debug(val);
}


// --------------------------
// const author = "saragiud"
// const reader = await new ArtilcesReader(`author/${author}/`).initialize();

// const serializedArticles = reader.serializeAllArticlesPages();
// const articles = [];
// let totalArticles = 0
// let loading = 0;

// for (const articlesPage of serializedArticles) {
    
//     if(await articlesPage != null){
//         // si puo' fare meglio ma al momento funziona
//         // lo yield mi sa che l'avevo fatto anche per evitare questo
//         var temp = await articlesPage;
//         temp.forEach(v=>articles.push(v));
//     }
// }

// // .lenght e meglio di un foreach che conta
// totalArticles = articles.length;

// console.log(`Articoli totali di ${author}: ${totalArticles}`)

// //#region Parte seria

// const articlesDetails = [];

// for(const article of articles){
//     loading++;
//     console.log(`${loading}/${totalArticles}`);
//     var o = await reader.serializeArticle(article.articleUrl);
//     //articlesDetails.find(x=>x.articleID===o.articleID);
//     if(articlesDetails.some(e=>e.articleID===o.articleID)){
//         debugger
//     }
//     articlesDetails.includes()
//     articlesDetails.push(o);
// }

// // stampa solo gli articoli con dei commenti
// console.log(articlesDetails.filter(x=>x.numberOfCommets>0));
// // alcuni articoli sono buggati, mostrano nell'intestazione dei commenti che poi non ci sono
// // es. https://ilsaronno.it/2023/09/17/calcio-2-cat-h-un-insaziabile-cistellum-a-valanga-sul-dal-pozzo/
// // i commenti contengo dentro una lista chiamta reply (le risposte al commento) che a sua volta contiene un oggetto commento che a sua volta contiene una lista reply ecc...

// //#endregion