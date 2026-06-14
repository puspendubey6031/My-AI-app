import React from 'react';

const BannerAds: React.FC = () => {
  return (
    <div className="w-full flex justify-center my-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg w-full max-w-screen-lg h-[120px] md:w-[728px] md:h-[90px] flex items-center justify-center">
        <span className="text-gray-400 text-sm font-medium">
          Advertisement - Sponsored Content
        </span>
      </div>
    </div>
  );
};

export default BannerAds;