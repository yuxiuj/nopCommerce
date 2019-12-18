using System;
using System.Linq;
using System.Reflection;

namespace Nop.Core
{
    /// <summary>
    /// Base class for entities
    /// </summary>
    public abstract partial class BaseEntity
    {
        protected static EventHandler<BaseEntity> EntityUpdateByMethod;
        protected static EventHandler<BaseEntity> EntityUpdateByReflaction;

        protected BaseEntity()
        {
            EntityUpdateByMethod += UpdateByMethod;
            EntityUpdateByReflaction += UpdateByReflaction;
        }

        public void Update(object sender, BaseEntity newEntity, bool byReflaction = true)
        {
            if(byReflaction)
                EntityUpdateByReflaction?.Invoke(sender, newEntity);
            else
                EntityUpdateByMethod?.Invoke(sender, newEntity);
        }

        /// <summary>
        /// Gets or sets the entity identifier
        /// </summary>
        public int Id { get; set; }

        protected void UpdateByReflaction(object sender, BaseEntity newEntity)
        {
            if(GetType() != newEntity.GetType())
                return;

            if (Id != newEntity.Id)
                return;

            foreach (var property in GetType().GetProperties(BindingFlags.Public | BindingFlags.Instance).Where(p=>p.CanWrite && p.CanRead))
            {
                property.SetValue(this, property.GetValue(newEntity));
            }
        }

        public virtual void UpdateByMethod(object sender, BaseEntity newEntity)
        {
        }
    }
}
