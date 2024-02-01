import { HTMLElement, parse } from 'node-html-parser';
import got from 'got';

export class ArtilcesReader{
    #url = 'https://ilsaronno.it/';
    #numberOfPage = '';

    constructor(author){
        this.author = author;
    }

    async initialize(){
        const initInputRaw = await got(this.#url + this.author);
        const initInputHtml = parse(initInputRaw.body);

        this.#numberOfPage = initInputHtml
            .querySelectorAll('.page-link')
            .at(-2).innerText
            .replace('.','');

        return this;
    }

    // html to obj
    #articleSerialize(articleHtml){
        const title = articleHtml.querySelector('.title').getElementsByTagName('A')[0].innerText;
        const date = articleHtml.querySelector('.date').innerText;
        const category = articleHtml.querySelector('.shout').innerText;
        const articleUrl = articleHtml.querySelector('.title').getElementsByTagName('A')[0].attrs.href;
        const image = articleHtml.querySelector('img').attrs["data-src"] ?? undefined; //articleHtml.querySelector('img').attrs["data-src"] : undefined;

        // var dateTemp =articleUrl.split('/').filter(x=> !isNaN(parseInt(x)) );

        // const date = Date(dateTemp[0],dateTemp[1],dateTemp[2]);

    
        return {
            category,
            title,
            articleUrl,
            date,
            image,
        }
    }

    // restituisce tutti gli articoli di una pagina in html
    async #getPageArticles(page){
        const rawHtml = await got(this.#url + this.author + 'page/' + page + "");
        const html = parse(rawHtml.body);

        return html.querySelector('.news_items_column').childNodes;
    }

    async serializeSingleArticlesPage(page){
        if (page <= this.#numberOfPage) {
          const articles = await this.#getPageArticles(page);

          const res = [];

          for (const iterator of articles) {
            if (iterator instanceof HTMLElement) {
                res.push(this.#articleSerialize(iterator))
            } else continue
          }

          return res;
        }
    }

    serializeAllArticlesPages(){
        let serializedArticles = []
        for (let currentPage = 1; currentPage < this.#numberOfPage + 1; currentPage++){
            serializedArticles.push(this.serializeSingleArticlesPage(currentPage));
        }
        return serializedArticles
    }

    async serializeRangeArticlesPages(startPage,endPage){
        if(startPage<endPage&&endPage<=this.#numberOfPage){
            const res = [];

            for (let index = startPage; index != endPage+1; index++) {
                for (const iterator of await this.serializeSingleArticlesPage(index)) {
                    res.push(iterator);
                }
            }

            return res;
        }

        return null;
    }

    async serializeArticle(articleUrl){
        var rawHtml = await got(articleUrl);
        var html = parse(rawHtml.body);

        const articleTitle = html.querySelector('h1').text.trim();

        const numberOfCommets = Number(html.querySelector('.comments_number').innerText);
        const comments = [];
        if(numberOfCommets>0){
            const rawComments = html.querySelectorAll('li.comment.depth-1');
            
            for await(const item of rawComments){
                comments.push(await this.#serilaizeComment(item));
            }
        }

        const tags = html.querySelectorAll('ul.tag_list li a').map(v => {
            return {
                name: v.text.trim(),
                href: v.attributes['href']
            };
        });

        const author = html.querySelector('div.author div a').getAttribute('href').split('/')[4];

        const date = html.querySelector('div.author div .date').text;

        //var test = articleUrl.split('/')[2];

        return {
            articleID: String(articleUrl.split('/')[6]),
            articleTitle : articleTitle,
            numberOfCommets: numberOfCommets,
            comments: comments,
            tags: tags,
            authorId: author,
            date: date,
        }
    }

    async #serilaizeComment(comment){
        const commentBody = await comment.querySelector('div.comment-body');
        const commentReplys = await comment.querySelector('.children');

        const author = commentBody.querySelector('div.comment-author cite').text;
        const date = commentBody.querySelector('div.commentmetadata a').text;
        const text = commentBody.querySelector('p').text;
        const reply = [];

        if(commentReplys!=null){
            for await(const i of commentReplys.childNodes){
                reply.push(await this.#serilaizeComment(i));
            }
        }
        
        return {
            author:author,
            date:date,
            body:text,
            reply:reply,
        };
    }

    static async serializeAllArticlesPagesByDate(date){
        
    }

}