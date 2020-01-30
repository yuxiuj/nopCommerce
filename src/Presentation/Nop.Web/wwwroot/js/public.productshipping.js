let ProductShipping = {
    jqXHR: false,
    form: false,
    fetchUrl: false,
    loadWaiting: false,
    localizedData: false,
    selectedShippingOption: 'not_init',

    init: function (form, fetchUrl, localizedData) {
        this.form = form;
        this.fetchUrl = fetchUrl;
        this.localizedData = localizedData;

        let address = this.getShippingAddress();
        if (this.addressIsValid(address))
            this.getShippingOptions(address);
        else
            this.selectShippingOption();

        let self = this;
        let reloadPopUp = false;

        let attributeChangedHandler = function () {
            if (self.selectedShippingOption) {
                let address;

                if (self.selectedShippingOption !== 'not_init') {
                    address = self.selectedShippingOption.address;

                    let enteredAddress = self.getShippingAddress();
                    if (!self.isSameAddress(address, enteredAddress)) {
                        reloadPopUp = true;
                    }
                }
                else {
                    address = self.getShippingAddress();
                }

                self.getShippingOptions(address, true);
            } else {
                reloadPopUp = true;
            }
        };
        // Prevent double init on load. If product has attributes then trigger is fires when page is loaded and attributes are loaded.
        setTimeout(function () {
            $(document).on('product_attributes_changed', attributeChangedHandler);
        }, 500);
        $(document).on('product_quantity_changed', attributeChangedHandler);


        let addressChangedHandler = function () {
            let address = self.getShippingAddress();
            self.getShippingOptions(address, true);
        };
        $('#CountryId').on('change', function () {
            $("#StateProvinceId").val(0);
            addressChangedHandler();
        });
        $('#StateProvinceId').on('change', addressChangedHandler);
        $('#ZipPostalCode').on('input propertychange paste', addressChangedHandler);


        $('#open-shipping-options').magnificPopup({
            type: 'inline',
            removalDelay: 500,
            callbacks: {
                beforeOpen: function () {
                    this.st.mainClass = this.st.el.attr('data-effect');
                },
                open: function () {
                    if (reloadPopUp) {
                        let address = self.getShippingAddress();
                        self.getShippingOptions(address, true);

                        reloadPopUp = false;
                    }
                }
            }
        });

        $('#estimate-shipping-button').on('click', function () {
            let shippingOption = self.getActiveShippingOption();
            self.selectShippingOption(shippingOption);

            $.magnificPopup.close();
        });
    },

    setLoadWaiting: function (keepDisabled) {
        this.loadWaiting = keepDisabled;
        if (keepDisabled) {
            $('#shipping-methods-body').html($('<div/>', { class: 'shipping-methods-loading' }));

            if (!$.magnificPopup.instance.isOpen) {
                $('#shipping-price-rate').html($('<span/>', { class: 'selected-shipping-loading' }))
                $('#open-shipping-options').empty();
                $('#estimated-delivery').empty();
            }
        }
    },

    getShippingOptions: function (address, force) {
        if (!force && this.loadWaiting) return;

        let productId = $('#ProductId').val();
        if (productId && productId > 0 && this.addressIsValid(address)) {
            this.setLoadWaiting(true);

            $('.message-failure').empty();

            if (force && this.jqXHR && this.jqXHR.readyState !== 4) {
                this.jqXHR.abort();
            }

            let params = $.param({
                ProductId: productId,
                CountryId: address.countryId,
                StateProvinceId: address.stateProvinceId,
                ZipPostalCode: address.zipPostalCode
            });

            let self = this;

            this.jqXHR = $.ajax({
                cache: false,
                url: `${this.fetchUrl}?${params}`,
                data: $(this.form).serialize(),
                type: 'POST',
                success: function (response) {
                    self.successHandler(address, response);
                },
                complete: function () {
                    self.setLoadWaiting(false);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    self.errorHandler(jqXHR, textStatus, errorThrown);
                }
            });
        }
    },

    successHandler: function (address, response) {
        if (response) {
            let activeOption;

            let options = response.ShippingOptions;
            if (options && options.length > 0) {
                $('#shipping-methods-body').empty();

                let self = this;

                $.each(options, function (i, option) {
                    if (self.selectedShippingOption &&
                        self.selectedShippingOption.provider === option.Name &&
                        self.isSameAddress(self.selectedShippingOption.address, address)) {
                        activeOption = {
                            provider: option.Name,
                            price: option.Price,
                            address: address,
                            deliveryDate: option.DeliveryDateFormat
                        };
                    }
                    self.addShippingOption(option.Name, option.DeliveryDateFormat, option.Price);
                });

                if (!activeOption) {
                    activeOption = {
                        provider: options[0].Name,
                        price: options[0].Price,
                        deliveryDate: options[0].DeliveryDateFormat,
                        address: address
                    };
                }
                this.setActiveShippingOption(activeOption);
            } else {
                this.clearShippingOptions();
            }

            if (this.selectedShippingOption) {
                if (this.selectedShippingOption === 'not_init' || this.isSameAddress(this.selectedShippingOption.address, address)) {
                    this.selectShippingOption(activeOption);
                }
            }
        }
    },

    errorHandler: function (jqXHR, textStatus, errorThrown) {
        if (textStatus === 'abort') return;

        if (jqXHR.status >= 400) {
            let response = jqXHR.responseJSON;
            if (response instanceof Object && response.hasOwnProperty('Errors')) {
                let errorBox = $('.message-failure').empty();
                $.each(response.Errors, function (i, error) {
                    errorBox.append($('<div/>').text(error));
                });
            }
        }

        if (this.selectedShippingOption === 'not_init') {
            this.selectShippingOption();
        }

        this.clearShippingOptions();
    },

    clearShippingOptions: function () {
        $('#shipping-methods-body').html($('<div/>', { class: 'no-shipping-options' }).text(this.localizedData.NoShippingOptions));
    },

    selectShippingOption: function (option) {
        if (option && option.provider && option.price && this.addressIsValid(option.address)) {
            this.selectedShippingOption = option;

            $('#shipping-price-rate').text(option.price);
            $('#selected-shipping-option').show();
            $('#open-shipping-options')
                .html($('<span/>').text(`${this.localizedData.ToAddress} ${option.address.countryName}, ${(option.address.stateProvinceName ? option.address.stateProvinceName + ',' : '')} ${option.address.zipPostalCode} ${this.localizedData.ViaProvider} ${option.provider}`))
                .append($('<i/>', { class: 'arrow-down' }));

            if (option.deliveryDate && option.deliveryDate !== '-') {
                $('#estimated-delivery').text(`${this.localizedData.EstimatedDeliveryPrefix} ${option.deliveryDate}`);
            } else {
                $('#estimated-delivery').empty();
            }
        } else {
            this.selectedShippingOption = undefined;

            $('#shipping-price-rate').empty();
            $('#selected-shipping-option').hide();
            $('#open-shipping-options')
                .html($('<span/>').text(this.localizedData.NoSelectedShippingOption))
                .append($('<i/>', { class: 'arrow-down' }));
            $('#estimated-delivery').empty();
        }
    },

    addShippingOption: function (name, deliveryDate, price) {
        if (!name || !price) return;

        let shippingMethod = $('<div/>', { class: 'estimate-shipping-row shipping-method' });

        shippingMethod
            .append($('<div/>', { class: 'estimate-shipping-row-item-radio' })
                .append($('<input/>', { type: 'radio', name: 'shipping-option', class: 'estimate-shipping-radio' }))
                .append($('<label/>')))
            .append($('<div/>', { class: 'estimate-shipping-row-item shipping-item' }).text(name))
            .append($('<div/>', { class: 'estimate-shipping-row-item shipping-item' }).text(deliveryDate ? deliveryDate : '-'))
            .append($('<div/>', { class: 'estimate-shipping-row-item shipping-item' }).text(price));

        shippingMethod.on('click', function () {
            $('input[name="shipping-option"]', this).prop('checked', true);
            $('.shipping-method.active').removeClass('active');
            $(this).addClass('active');
        });

        $('#shipping-methods-body').append(shippingMethod);
    },

    getActiveShippingOption: function () {
        let shippingItems = $('.shipping-item', $('.shipping-method.active'));
        let provider = shippingItems.eq(0).text().trim();
        let deliveryDate = shippingItems.eq(1).text().trim();
        let price = shippingItems.eq(2).text().trim();

        return {
            provider: provider,
            price: price,
            deliveryDate: deliveryDate,
            address: this.getShippingAddress()
        };
    },

    setActiveShippingOption: function (option) {
        $.each($('.shipping-method'), function (i, shippingMethod) {
            let shippingItems = $('.shipping-item', shippingMethod);
            let provider = shippingItems.eq(0).text().trim();
            let price = shippingItems.eq(2).text().trim();
            if (provider == option.provider && price == option.price) {
                $(shippingMethod).trigger('click');
                return;
            }
        });
    },

    getShippingAddress: function () {
        let address = {};

        let selectedCountryId = $('#CountryId').find(':selected');
        if (selectedCountryId && selectedCountryId.val() > 0) {
            address.countryId = selectedCountryId.val();
            address.countryName = selectedCountryId.text();
        }

        let selectedStateProvinceId = $('#StateProvinceId').find(':selected');
        if (selectedStateProvinceId && selectedStateProvinceId.val() > 0) {
            address.stateProvinceId = selectedStateProvinceId.val();
            address.stateProvinceName = selectedStateProvinceId.text();
        }

        let selectedZipPostalCode = $('#ZipPostalCode');
        if (selectedZipPostalCode && selectedZipPostalCode.val()) {
            address.zipPostalCode = selectedZipPostalCode.val();
        }

        return address;
    },

    isSameAddress: function (address1, address2) {
        return address1.countryId === address2.countryId && address1.stateProvinceId === address2.stateProvinceId && address1.zipPostalCode === address2.zipPostalCode;
    },

    addressIsValid: function (address) {
        return address && address.countryName && address.countryId > 0 && address.zipPostalCode;
    }
};