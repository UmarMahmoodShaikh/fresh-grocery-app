import { algoliasearch } from 'algoliasearch';
import aa from 'search-insights';

const appId = process.env.EXPO_PUBLIC_ALGOLIA_APP_ID || '';
const apiKey = process.env.EXPO_PUBLIC_ALGOLIA_SEARCH_KEY || '';

export const searchClient = algoliasearch(appId, apiKey);
export const recommendClient = searchClient.initRecommend();

aa('init', {
  appId,
  apiKey,
  useCookie: true,
});

export const insights = aa;

export const trackProductView = (userToken: string, objectID: string) => {
  aa('viewedObjectIDs', {
    userToken,
    index: 'Product',
    eventName: 'Product Viewed',
    objectIDs: [objectID],
  });
};

export const trackProductClick = (userToken: string, objectID: string) => {
  aa('clickedObjectIDs', {
    userToken,
    index: 'Product',
    eventName: 'Product Clicked',
    objectIDs: [objectID],
  });
};

export const trackAddToCart = (userToken: string, objectID: string) => {
  aa('convertedObjectIDs', {
    userToken,
    index: 'Product',
    eventName: 'Added to Cart',
    objectIDs: [objectID],
  });
};
