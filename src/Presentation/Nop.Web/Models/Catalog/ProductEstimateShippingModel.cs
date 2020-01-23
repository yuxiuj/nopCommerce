using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc.Rendering;
using Nop.Web.Framework.Models;
using Nop.Web.Framework.Mvc.ModelBinding;

namespace Nop.Web.Models.Catalog
{
    public partial class ProductEstimateShippingModel : BaseNopModel
    {
        public ProductEstimateShippingModel()
        {
            AvailableCountries = new List<SelectListItem>();
            AvailableStates = new List<SelectListItem>();
        }

        public bool Enabled { get; set; }

        public int ProductId { get; set; }

        [NopResourceDisplayName("Products.EstimateShipping.Country")]
        public int? CountryId { get; set; }
        [NopResourceDisplayName("Products.EstimateShipping.StateProvince")]
        public int? StateProvinceId { get; set; }
        [NopResourceDisplayName("Products.EstimateShipping.ZipPostalCode")]
        public string ZipPostalCode { get; set; }

        public IList<SelectListItem> AvailableCountries { get; set; }
        public IList<SelectListItem> AvailableStates { get; set; }
    }
}
