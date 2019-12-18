using System.Collections.Generic;
using System.Linq;
using Nop.Core.Infrastructure;

namespace Nop.Core.Caching.Extensions
{
    public static class IQueryableExtensions
    {
        public static IList<TEntity> ToCachedList<TEntity>(this IQueryable<TEntity> query) where TEntity : BaseEntity
        {
            return EngineContext.Current.Resolve<IStaticCacheManager>().Get(query.ToString(), query.ToList);
        }
    }
}
