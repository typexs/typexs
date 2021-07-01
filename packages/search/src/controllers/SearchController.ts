// import {Body, ContentType, Get, JsonController, Param, Post} from "routing-controllers";
// import {Inject, Log} from "@typexs/base";
// import {ContextGroup} from "@typexs/server";
// import {Client} from "elasticsearch";
//
// /**
//  * Controller that handles search requests
//  */
// @ContextGroup("api")
// @JsonController()
// export class SearchController {
//
//   @Inject("ElasticSearchClient")
//   ElasticSearchClient: Client;
//
//   /**
//    * Execute a search with a query
//    * @param {string} query Query to search for
//    */
//   @Get("/search/:query")
//   @ContentType("application/json")
//   async getSearch(@Param("query") query: string) {
//     Log.info("ElasticSearchClient searching for:", query);
//
//     // execute query against ElasticSearch and return results
//     return await this.ElasticSearchClient.search({
//       body: {
//         size: 30,
//         query: {
//           match: {
//             _all: query
//           }
//         }
//       }
//     });
//   }
//
//   @Post("/search")
//   @ContentType("application/json")
//   async postSearch(@Body() body: { query?: string | any; from?: number | any; size?: number | any }) {
//     Log.info(body);
//
//     if (typeof body === "undefined") {
//       body = {};
//     }
//
//     if (typeof body.query !== "string") {
//       body.query = "*";
//     }
//
//     if (typeof body.from !== "number") {
//       body.from = 0;
//     }
//
//     if (typeof body.size !== "number") {
//       body.size = 30;
//     }
//
//     // execute query against ElasticSearch and return results
//     return await this.ElasticSearchClient.search({
//       body: {
//         size: body.size,
//         from: body.from,
//         query: {
//           match: {
//             _all: body.query
//           }
//         }
//       }
//     });
//   }
// }
