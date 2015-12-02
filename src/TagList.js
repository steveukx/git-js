
module.exports = TagList;

function TagList (tagList) {
   this.latest = tagList.length && tagList[tagList.length - 1];
   this.all = tagList
}

TagList.parse = function (tags) {
   return new TagList(tags.split('\n').map(function (item) { return item.trim(); }).sort(function (tagA, tagB) {
      var partsA = tagA.split('.');
      var partsB = tagB.split('.');

      for (var i = 0, l = Math.max(partsA.length, partsB.length); i < l; i++) {
         var diff = partsA[i] - partsB[i];
         if (diff) {
            return diff > 0 ? 1 : -1;
         }
      }

      return 0;
   }));
};
