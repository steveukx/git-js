// @ts-check

(function () {
   const tocContainer = document.querySelector(".toc-container");
   /** @type {HTMLElement[]} */
   const tocContainerStack = [];
   if (tocContainer) {
      tocContainerStack.push(
         tocContainer.appendChild(document.createElement("ol"))
      );
   }

   const headers = document.querySelectorAll("h1, h2, h3, h4, h5, h6");

   headers.forEach(function (header) {
      if (header.parentElement.tagName != "A") {
         const anchor = header.parentElement.insertBefore(
            document.createElement("a"),
            header
         );
         anchor.href = "#" + header.id;
         anchor.appendChild(header);

         if (tocContainer) {
            const level = +header.tagName.substr(1);
            if (level > 1 && headers.length > 100) {
               return;
            }

            if (level < tocContainerStack.length) {
               tocContainerStack.pop();
            } else if (level > tocContainerStack.length) {
               const container = document.createElement("ol");
               const containerLi = tocContainerStack[
               tocContainerStack.length - 1
                  ].appendChild(document.createElement("li"));
               containerLi.appendChild(container);
               tocContainerStack.push(container);
            }

            const element = document.createElement("li");
            const tocAnchor = element.appendChild(
               document.createElement("a")
            );
            tocAnchor.textContent = header.textContent;
            tocAnchor.href = anchor.href;
            tocContainerStack[tocContainerStack.length - 1].appendChild(
               element
            );
         }
      }
   });
})();
