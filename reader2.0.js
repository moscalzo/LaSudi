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
        // if (this.#urlRegex.test(url)) {
        if (true) {
            const rawHtml = await got(url);
            if (rawHtml.ok) {
                const html = parse(rawHtml.body);
                if (html instanceof HTMLElement) {
                    return html;
                } else {
                    throw new Error();
                }
            } else {
                throw new Error();
            }
        } else {
            throw new Error();
        }

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

        const numberOfCommets = Number(html.querySelector('.comments_number').innerText);
        const comments = [];
        if (numberOfCommets > 0) {
            const rawComments = html.querySelectorAll('li.comment.depth-1');

            for (const item of rawComments) {
                comments.push(this.#serilaizeComment(item));
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

        return {
            articleID: articleRow.articleID,
            articleTitle: articleTitle,
            numberOfCommets: numberOfCommets,
            comments: comments,
            tags: tags,
            authorId: author,
            date: date,
        }
    }

    static #serilaizeComment(comment) {
        const commentBody = comment.querySelector('div.comment-body');
        const commentReplys = comment.querySelector('.children');

        const author = commentBody.querySelector('div.comment-author cite').text;
        const date = commentBody.querySelector('div.commentmetadata a').text;
        const text = commentBody.querySelector('p').text;
        const reply = [];

        if (commentReplys != null) {
            for (const i of commentReplys.childNodes) {
                reply.push(this.#serilaizeComment(i));
            }
        }

        return {
            author: author,
            date: date,
            body: text,
            reply: reply,
        };
    }

    /**
     * 
     * @param {Date} date 
     */
    static async serializeAllArticlesPagesByDate(date) {
        let html =  await this.serializeHtml(`https://ilsaronno.it/${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}`);
        const TotalPages =  Number(this.#getNumberOfPages(html));

        const res = [];
        for (let index = 1; index !== TotalPages+1; index++) {
            html = await this.serializeHtml(`https://ilsaronno.it/${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}/page/${index}`);
            let articles = this.getAllPageRows(html);

            for (let article of articles) {
                res.push(await this.serializeArticle(this.readArticleRow(article)));
            }
        }

        return res;
    }

}