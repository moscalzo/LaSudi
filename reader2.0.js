import { HTMLElement, parse } from 'node-html-parser';
import got from 'got';

export class reader2 {

    static #urlRegex = /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig;

    /**
     * 
     * @param {string} url 
     * @returns {Promise<HTMLElement>} html body 
     * @description Ritorna la pagina richiesta validata
     */
    static async serializeHtml(url) {
        if (!url) throw `URL: "${url}" non valido`
        
        const rawHtml = await got(url);
        const html = parse(rawHtml.body);

        if (html instanceof HTMLElement) return html
    }

    /**
     * 
     * @param {Author} author 
     */
    static async serializeAllArticlesPagesByAuthor(author) {
        let url = `https://ilsaronno.it/author/${author}`
        let html =  await this.serializeHtml(url);
        const totalPages =  Number(this.#getNumberOfPages(html));

        const res = [];

        for (let index = 1; index <= totalPages; index++) {
            html = await this.serializeHtml(`${url}/page/${index}`);
            console.log(`${index}/${totalPages} pagine`)
            let articles = this.getAllPageRows(html);

            for (let article of articles) {
                res.push(await this.serializeArticle(this.readArticleRow(article)));
            }
        }

        return res;
    }

    /**
     * 
     * @param {Date} date 
     */
    static async serializeAllArticlesPagesByDate(date) {
        let url = `https://ilsaronno.it/${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}`
        let html =  await this.serializeHtml(url);
        const totalPages =  Number(this.#getNumberOfPages(html));

        const res = [];

        for (let index = 1; index <= totalPages; index++) {
            html = await this.serializeHtml(`${url}/page/${index}`);
            let articles = this.getAllPageRows(html);

            for (let article of articles) {
                res.push(await this.serializeArticle(this.readArticleRow(article)));
            }
        }

        return res;
    }

    /**
     * 
     * @param {HTMLElement} html 
     * @returns {HTMLElement[]}
     */
    static getAllPageRows(html) {
        const result = html.querySelector('.news_items_column').childNodes;
        return result;
    }

    /**
     * 
     * @param {HTMLElement} articleRow
     * @returns 
     */
    static readArticleRow(articleRow) {
        const title = articleRow.querySelector('.title').getElementsByTagName('A')[0].innerText;
        const date = articleRow.querySelector('.date').innerText;
        const category = articleRow.querySelector('.shout').innerText;
        const articleUrl = articleRow.querySelector('.title').getElementsByTagName('A')[0].attrs.href;
        const image = articleRow.querySelector('img').attrs["data-src"] ?? undefined;
        const articleID = String(articleUrl.split('/')[6]);

        return {
            articleID,
            category,
            title,
            articleUrl,
            date,
            image,
        }
    }

    /**
     * 
     * @param {HTMLElement} html 
     * @returns {number} number of page
     */
    static #getNumberOfPages(html) {
        return html
            .querySelectorAll('.page-link')
            .at(-2).innerText
            .replace('.', '');
    }

    /**
     * 
     * @param {{articleID,category,title,articleUrl,date,image}} articleRow
     * @returns 
     */
    static async serializeArticle(articleRow) {
        const html = await this.serializeHtml(articleRow.articleUrl);
        const articleTitle = html.querySelector('h1').text.trim();

        const numberOfComments = Number(html.querySelector('.comments_number').innerText);
        const comments = [];
        if (numberOfComments > 0) {
            const rawComments = html.querySelectorAll('li.comment');

            for (const item of rawComments) {
                comments.push(this.#serilaizeComment(item));
            }
        }

        const tags = html.querySelectorAll('ul.tag_list li a').map(tag => {
            return tag.text.trim();
        });

        const author = html.querySelector('div.author div a').getAttribute('href').split('/')[4];

        const date = html.querySelector('div.author div .date').text;

        return {
            articleID: articleRow.articleID,
            articleTitle: articleTitle,
            numberOfComments: comments.length,
            comments: comments,
            tags: tags,
            authorId: author,
            date: date,
        }
    }

    static #serilaizeComment(comment) {
        const commentBody = comment.querySelector('div.comment-body');

        const author = commentBody.querySelector('div.comment-author cite').text;
        const date = commentBody.querySelector('div.commentmetadata a').text;
        const text = commentBody.querySelector('p').text;

        return {
            author: author,
            date: date,
            body: text,
        };
    }

}