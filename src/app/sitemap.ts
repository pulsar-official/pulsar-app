import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://pulsar.zone', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://pulsar.zone/sign-up', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  ]
}
