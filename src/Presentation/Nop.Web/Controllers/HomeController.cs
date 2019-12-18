using System;
using Microsoft.AspNetCore.Mvc;
using Nop.Data;
using Nop.Services.Catalog;
using Nop.Web.Framework.Mvc.Filters;
using Nop.Web.Framework.Security;
using Nop.Core.Domain.Catalog;

namespace Nop.Web.Controllers
{
    public partial class HomeController : BasePublicController
    {
        protected static Random _random = new Random();

        public HomeController(IRepository<Product> pRepository, IProductService productService)
        {
            var products = productService.GetAllProductsDisplayedOnHomepage();
            
            var product = products[_random.Next() % products.Count];

            var oldName = product.Name;
            var oldShortDescription = product.ShortDescription;
            var oldFullDescription = product.FullDescription;

            // load from DB
            var dbProduct = pRepository.GetById(product.Id);

            dbProduct.Name = dbProduct.ShortDescription = dbProduct.FullDescription = "Test";

            pRepository.Update(dbProduct, false);

            var rezM = product.FullDescription == dbProduct.FullDescription;

            pRepository.Update(dbProduct, true);

            var rezR = product.FullDescription == dbProduct.FullDescription;

            dbProduct.Name = oldName;
            dbProduct.ShortDescription = oldShortDescription;
            dbProduct.FullDescription = oldFullDescription;

            pRepository.Update(dbProduct);

            throw new Exception($"FullDescription updated by method: {rezM}, FullDescription updated by reflaction: {rezR}");
        }

        [HttpsRequirement(SslRequirement.No)]
        public virtual IActionResult Index()
        {
            return View();
        }
    }
}