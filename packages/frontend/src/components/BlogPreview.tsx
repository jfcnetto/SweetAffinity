
import React from 'react';
import type { Article } from '../types';

interface BlogPreviewProps {
  articles: Article[];
}

const ArticleCard: React.FC<{ article: Article }> = ({ article }) => (
  <div className="bg-white rounded-lg shadow-lg overflow-hidden group">
    <div className="overflow-hidden">
        <img src={article.imageUrl} alt={article.title} className="w-full h-48 object-cover transform group-hover:scale-110 transition-transform duration-500" />
    </div>
    <div className="p-6">
      <h3 className="text-xl font-bold mb-2 font-display">{article.title}</h3>
      <p className="text-gray-600 mb-4 text-sm">{article.summary}</p>
      <a href="#" className="font-semibold text-gradient-pink hover:text-gradient-orange transition-colors">Leia mais &rarr;</a>
    </div>
  </div>
);

const BlogPreview: React.FC<BlogPreviewProps> = ({ articles }) => {
  return (
    <section id="blog" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-12 font-display text-gray-800">Nosso Blog</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {articles.map((article, index) => (
            <ArticleCard key={index} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogPreview;
