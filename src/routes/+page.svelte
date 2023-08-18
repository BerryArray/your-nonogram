<script lang="ts">
    import { get, getDatabase, push, ref, set } from "firebase/database"
    import { app } from "$lib/firebase_app"

    const db = getDatabase(app);

    type Level = {
        columns: number,
        rows: number,
        title: string,
        description: string,
        solutionString: string
    };
    
    let columns = 10;
    let rows = 10;

    $: grid = Array(columns*rows).fill("empty")
    $: columnHints = Array(columns).fill([])
    $: rowHints = Array(rows).fill([])
    let solutionGrid = Array(columns*rows).fill("empty")
    
    $: solutionGrid, calculateHints()
    $: grid, solutionGrid, calculateHintGreying()
    
    let columnChoices = [5,10,15]
    let rowChoices = [5,10,15]
    
    let puzzleTitle = "TestTitle"
    let puzzleDescription = "TestDescription"
    
    let editMode = false
    
    let fillMode = "off"
    let hoveredCell : number = NaN;

    let savedLevels : Level[] = []
    let cachedLevels : string[] = []

    const maxUploadsPerDay = 12;
    let uploadsToday = 0;
    
    const maxDownloadsPerDay = 150;
    let downloadsToday = 0;
    
    setInterval(function () {
        uploadsToday = 0;
        downloadsToday = 0;
    }, 86400000)

    let levelUploaded = false;
    $: solutionGrid, puzzleDescription, puzzleTitle, levelUploaded = false;
    let levelSaved = false;
    $: solutionGrid, puzzleDescription, puzzleTitle, levelSaved = false;

    try {
        savedLevels = JSON.parse(localStorage.levels)
    } catch {
        savedLevels = []
    }
    try {
        cachedLevels = JSON.parse(localStorage.downloadCache)
    } catch {
        getNewCache()
    }

    let showHelp = false;
    
    function clickCell(e: MouseEvent, cellIndex: number) {
        if (editMode == true) {
            if (solutionGrid[cellIndex] != "empty") {
                fillMode = "clear"
                solutionGrid[cellIndex] = "empty";
                return;
            }
            
            if (e.button == 0) {
                fillMode = "fill";
                solutionGrid[cellIndex] = "filled";
            }
        }
        else {
            if (grid[cellIndex] != "empty") {
                fillMode = "clear"
                grid[cellIndex] = "empty";
                return;
            }
            
            switch (e.button) {
                case 0:
                    fillMode = "fill";
                    grid[cellIndex] = "filled";
                    break;
                case 2:
                    fillMode = "cross";
                    grid[cellIndex] = "crossed";
                    break;
            }
        }
    }
            
    function enterCell(cellIndex: number) {
        hoveredCell = cellIndex;
        
        if (editMode == true) {
            switch (fillMode) {
                case "fill":
                    if (solutionGrid[cellIndex] == "empty") {
                        solutionGrid[cellIndex] = "filled";
                    }
                break;
            case "clear":
                solutionGrid[cellIndex] = "empty";
                break;
            }
        }
        else {
            switch (fillMode) {
            case "fill":
                if (grid[cellIndex] == "empty") {
                    grid[cellIndex] = "filled";
                }
                break;
            case "cross":
                if (grid[cellIndex] == "empty") {
                    grid[cellIndex] = "crossed";
                }
                break;
            case "clear":
                grid[cellIndex] = "empty";
                break;
            }
        }
    }

    function mouseUp() {
        fillMode = "off";
    }
    
    function calculateHints() {
        for (let column = 0; column < columns; column++) {
            columnHints[column] = []
            let len = 0
            for (let row = 0; row < rows; row++) {
                if (solutionGrid[column + row*columns] == "filled") {
                    len++
                }
                else if (len != 0) {
                    columnHints[column].push({number: len, greyed: false})
                    columnHints = columnHints
                    len = 0
                }
                else {
                    len = 0
                }
            } 
            if (len != 0) {
                columnHints[column].push({number: len, greyed: false})
                columnHints = columnHints
            }
            if (columnHints[column].length == 0) {
                columnHints[column].push({number: 0, greyed: false})
                columnHints = columnHints
            }
        }
        for (let row = 0; row < rows; row++) {
            rowHints[row] = []
            let len = 0
            for (let column = 0; column < columns; column++) {
                if (solutionGrid[column + row*columns] == "filled") {
                    len++
                }
                else if (len != 0) {
                    rowHints[row].push({number: len, greyed: false})
                    rowHints = rowHints
                    len = 0
                }
                else {
                    len = 0
                }
            } 
            if (len != 0) {
                rowHints[row].push({number: len, greyed: false})
                rowHints = rowHints
            }
            if (rowHints[row].length == 0) {
                rowHints[row].push({number: 0, greyed: false})
                rowHints = rowHints
            }
        }
    }

    // TODO!!! Fix this function to not be so garbo! It's disabled right now!
    // function calculateHintGreying() {
    //     return
        
    //     column_loop:
    //     for (let column = 0; column < columns; column++) {
    
    //         if (columnHints[column][0].number == 0) {
    //             let columnEmpty = true
    
    //             for (let row = 0; row < rows; row++) {
    //                 if (grid[column + row*columns] == "filled") {
    //                     columnEmpty = false
    //                     break
    //                 }
    //             }
    
    //             columnHints[column][0].greyed = columnEmpty
    //             continue
    //         }
    
    //         for (let i = 0; i < columnHints[column].length; i++) {
    //             columnHints[column][i].greyed = false
    //         }
            
    //         let len = 0
    //         let hintIndex = 0
    //         let lastCheckLenght = 0;
    //         for (let row = 0; row < rows; row++) {
    //             if (grid[column + row*columns] == "filled") {
    //                 len++
    
    //                 if (hintIndex == columnHints[column].length) {
    //                     for (let i = 0; i < columnHints[column].length; i++) {
    //                         columnHints[column][i].greyed = false
    //                     }
    //                     continue column_loop;
    //                 }
    //             }
    //             else if (len != 0) {
    //                  {
    //                     if (columnHints[column][hintIndex].number == len) {
    //                         columnHints[column][hintIndex].greyed = true;
    //                         hintIndex++
    //                         lastCheckLenght = row
    //                     }
    //                     else {
    //                         len = 0;
    //                         break;
    //                     }
                        
    //                     len = 0
    //                 }
    //             }
    //         }
    //         if (len != 0 && columnHints[column][hintIndex].number == len) {
    //             columnHints[column][hintIndex].greyed = true;
    //             hintIndex++
    //         }
    //         if (hintIndex == columnHints[column].length) {
    //             continue column_loop;
    //         }
            
            
    //         len = 0
    //         hintIndex = columnHints[column].length - 1
    //         let compareCheckLenght = rows - 1;
    //         for (let row = rows - 1; row >= 0; row--) {
    //             if (grid[column + row*columns] == "filled") {
    //                 len++
    //                 compareCheckLenght = row
    
    //                 if (compareCheckLenght <= lastCheckLenght) {
    //                     break
    //                 }
    //             }
    //             else if (len != 0) {
    //                  {
    //                     if (columnHints[column][hintIndex].number == len) {
    //                         columnHints[column][hintIndex].greyed = true;
    //                         hintIndex--
    //                     }
    //                     else {
    //                         len = 0;
    //                         break;
    //                     }
                        
    //                     len = 0
    //                 }
    //             }
    //         }
    //     }
        
    //     row_loop:
    //     for (let row = 0; row < rows; row++) {
    
    //         if (rowHints[row][0].number == 0) {
    //             let rowEmpty = true
    
    //             for (let column = 0; column < columns; column++) {
    //                 if (grid[column + row*columns] == "filled") {
    //                     rowEmpty = false
    //                     break
    //                 }
    //             }
    
    //             rowHints[row][0].greyed = rowEmpty
    //             continue
    //         }
    
    //         for (let i = 0; i < rowHints[row].length; i++) {
    //             rowHints[row][i].greyed = false
    //         }
            
    //         let len = 0
    //         let hintIndex = 0
    //         let lastCheckLenght = 0;
    //         for (let column = 0; column < columns; column++) {
    //             if (grid[column + row*columns] == "filled") {
    //                 len++
    
    //                 if (hintIndex == rowHints[row].length) {
    //                     for (let i = 0; i < rowHints[row].length; i++) {
    //                         rowHints[row][i].greyed = false
    //                     }
    //                     continue row_loop;
    //                 }
    //             }
    //             else if (len != 0) {
    //                  {
    //                     if (rowHints[row][hintIndex].number == len) {
    //                         rowHints[row][hintIndex].greyed = true;
    //                         hintIndex++
    //                         lastCheckLenght = column
    //                     }
    //                     else {
    //                         len = 0;
    //                         break;
    //                     }
                        
    //                     len = 0
    //                 }
    //             }
    //         }
    //         if (len != 0 && rowHints[row][hintIndex].number == len) {
    //             rowHints[row][hintIndex].greyed = true;
    //             hintIndex++
    //         }
    //         if (hintIndex == rowHints[row].length) {
    //             continue row_loop;
    //         }
            
            
    //         len = 0
    //         hintIndex = rowHints[row].length - 1
    //         let compareCheckLenght = columns - 1;
    //         for (let column = columns - 1; column >= 0; column--) {
    //             if (grid[column + row*columns] == "filled") {
    //                 len++
    //                 compareCheckLenght = column
    
    //                 if (compareCheckLenght <= lastCheckLenght) {
    //                     break
    //                 }
    //             }
    //             else if (len != 0) {
    //                  {
    //                     if (rowHints[row][hintIndex].number == len) {
    //                         rowHints[row][hintIndex].greyed = true;
    //                         hintIndex--
    //                     }
    //                     else {
    //                         len = 0;
    //                         break;
    //                     }
                        
    //                     len = 0
    //                 }
    //             }
    //         }
    //     }
    // }

    type Branch = {
        blockLen: number,
        remainingHints: any,
        greyIndices: Array<number>,
        currentIndex: number,
        real: boolean
    };


    function wait(ms: number) {
        var start = Date.now(),
            now = start;
        while (now - start < ms) {
        now = Date.now();
        }
    }

    function calculateHintGreying() {
        // console.log("Started function...")
        
        for (let column = 0; column < columns; column++) {
        
            let branchArray : Branch[] = []
            branchArray.push({blockLen: 0, remainingHints: columnHints[column].slice().reverse(), greyIndices: [], currentIndex: 0, real: false})

            // console.log("branchArray init complete! Printing branchArray below:")
            // console.log(structuredClone(branchArray))

            if (columnHints[column][0].number == 0) {
                // console.log("Zero hint detected: checking crossing...")
                
                let columnEmpty = true

                for (let row = 0; row < rows; row++) {
                    if (grid[column + row*columns] != "crossed") {
                        columnEmpty = false
                        break
                    }
                }

                columnHints[column][0].greyed = columnEmpty
                // console.log("Zeros are crossed? " + columnEmpty + " Exiting...")
                continue;
            }

            columnHints[column].forEach((hint: { number: number, greyed: boolean; }) => {
                hint.greyed = false
            });

            for (let row = 0; row < rows; row++) {
                // console.log("Row " + row + " started!")
                
                switch (grid[column + row*columns]) {
                    case "filled":
                        // console.log("Cell " + row + " is filled!")
                        branchArray.forEach((branch: Branch) => {
                            branch.blockLen += 1
                            if (row == 0) {
                                branch.real = true
                            }
                        })
                        break;
                    
                    case "crossed": {
                        // console.log("Cell " + row + " is crossed!")
                        let newArray : Branch[] = []
                        branchArray.forEach((branch: Branch) => {
                            if (branch.blockLen != 0) {
                                let popped = branch.remainingHints.pop()
                                if (popped != undefined && popped.number == branch.blockLen) {
                                    branch.blockLen = 0
                                    if (branch.real == true) {
                                        branch.greyIndices.push(branch.currentIndex)
                                    }
                                    branch.currentIndex += 1
                                    branch.real = true
                                    newArray.push(branch)
                                }
                            }
                            else {
                                branch.real = true
                                newArray.push(branch)
                            }
                        })
                        branchArray = newArray
                        break;}
                    
                    case "empty": {
                        // console.log("Cell " + row + " is empty!")
                        let newArray : Branch[] = []
                        branchArray.forEach((branch: Branch) => {
                            let emptyCaseClone = structuredClone(branch)
                            emptyCaseClone.real = false
                            if (emptyCaseClone.blockLen != 0) {
                                let popped = emptyCaseClone.remainingHints.pop()
                                if ( popped != undefined && popped.number == emptyCaseClone.blockLen) {
                                    emptyCaseClone.blockLen = 0
                                    emptyCaseClone.currentIndex += 1
                                    newArray.push(emptyCaseClone)
                                }
                            }
                            else {
                                newArray.push(emptyCaseClone)
                            }
                            branch.blockLen += 1
                            branch.real = false
                        })
                        branchArray = branchArray.concat(newArray)
                        break;}
                }
                
                // console.log("Printing array below:")
                // console.log(structuredClone(branchArray))
            }

            let newArray : Branch[] = []
            branchArray.forEach((branch: Branch) => {
                if (branch.blockLen != 0) {
                    let popped = branch.remainingHints.pop()
                    if (popped != undefined && popped.number == branch.blockLen) {
                        if (branch.real == true) {
                            branch.greyIndices.push(branch.currentIndex)
                        }
                        newArray.push(branch)
                    }
                }
                else {
                    newArray.push(branch)
                }
            })
            branchArray = newArray

            branchArray = branchArray.filter((branch: Branch) => branch.remainingHints.length == 0)

            // console.log(structuredClone(branchArray))

            if (branchArray.length != 0) {
                let intersection = branchArray[0].greyIndices
                
                for (let i = 1; i < branchArray.length; i++) {
                    intersection = intersection.filter(index => branchArray[i].greyIndices.includes(index))
                }
                
                for (let i = 0; i < columnHints[column].length; i++) {
                    columnHints[column][i].greyed = intersection.includes(i)
                }

                // intersection.forEach(index => {
                //     columnHints[column][index].greyed = true
                // })
            }
            else {
                columnHints[column].forEach((hint: { number: number, greyed: boolean; }) => {
                    hint.greyed = false
                });
            }
        }

        // ROW PART
        for (let row = 0; row < rows; row++) {

            let branchArray : Branch[] = []
            branchArray.push({blockLen: 0, remainingHints: rowHints[row].slice().reverse(), greyIndices: [], currentIndex: 0, real: false})

            // console.log("branchArray init complete! Printing branchArray below:")
            // console.log(structuredClone(branchArray))

            if (rowHints[row][0].number == 0) {
                // console.log("Zero hint detected: checking crossing...")
                
                let rowEmpty = true

                for (let column = 0; column < columns; column++) {
                    if (grid[column + row*columns] != "crossed") {
                        rowEmpty = false
                        break
                    }
                }

                rowHints[row][0].greyed = rowEmpty
                // console.log("Zeros are crossed? " + columnEmpty + " Exiting...")
                continue;
            }

            rowHints[row].forEach((hint: { number: number, greyed: boolean; }) => {
                hint.greyed = false
            });

            for (let column = 0; column < columns; column++) {
                // console.log("Row " + row + " started!")
                
                switch (grid[column + row*columns]) {
                    case "filled":
                        // console.log("Cell " + row + " is filled!")
                        branchArray.forEach((branch: Branch) => {
                            branch.blockLen += 1
                            if (column == 0) {
                                branch.real = true
                            }
                        })
                        break;
                    
                    case "crossed": {
                        // console.log("Cell " + row + " is crossed!")
                        let newArray : Branch[] = []
                        branchArray.forEach((branch: Branch) => {
                            if (branch.blockLen != 0) {
                                let popped = branch.remainingHints.pop()
                                if (popped != undefined && popped.number == branch.blockLen) {
                                    branch.blockLen = 0
                                    if (branch.real == true) {
                                        branch.greyIndices.push(branch.currentIndex)
                                    }
                                    branch.currentIndex += 1
                                    branch.real = true
                                    newArray.push(branch)
                                }
                            }
                            else {
                                branch.real = true
                                newArray.push(branch)
                            }
                        })
                        branchArray = newArray
                        break;}
                    
                    case "empty": {
                        // console.log("Cell " + row + " is empty!")
                        let newArray : Branch[] = []
                        branchArray.forEach((branch: Branch) => {
                            let emptyCaseClone = structuredClone(branch)
                            emptyCaseClone.real = false
                            if (emptyCaseClone.blockLen != 0) {
                                let popped = emptyCaseClone.remainingHints.pop()
                                if ( popped != undefined && popped.number == emptyCaseClone.blockLen) {
                                    emptyCaseClone.blockLen = 0
                                    emptyCaseClone.currentIndex += 1
                                    newArray.push(emptyCaseClone)
                                }
                            }
                            else {
                                newArray.push(emptyCaseClone)
                            }
                            branch.blockLen += 1
                            branch.real = false
                        })
                        branchArray = branchArray.concat(newArray)
                        break;}
                }
                
                // console.log("Printing array below:")
                // console.log(structuredClone(branchArray))
            }

            let newArray : Branch[] = []
            branchArray.forEach((branch: Branch) => {
                if (branch.blockLen != 0) {
                    let popped = branch.remainingHints.pop()
                    if (popped != undefined && popped.number == branch.blockLen) {
                        if (branch.real == true) {
                            branch.greyIndices.push(branch.currentIndex)
                        }
                        newArray.push(branch)
                    }
                }
                else {
                    newArray.push(branch)
                }
            })
            branchArray = newArray

            branchArray = branchArray.filter((branch: Branch) => branch.remainingHints.length == 0)

            // console.log(structuredClone(branchArray))

            if (branchArray.length != 0) {
                let intersection = branchArray[0].greyIndices
                
                for (let i = 1; i < branchArray.length; i++) {
                    intersection = intersection.filter(index => branchArray[i].greyIndices.includes(index))
                }
                
                for (let i = 0; i < rowHints[row].length; i++) {
                    rowHints[row][i].greyed = intersection.includes(i)
                }

                // intersection.forEach(index => {
                //     columnHints[column][index].greyed = true
                // })
            }
            else {
                rowHints[row].forEach((hint: { number: number, greyed: boolean; }) => {
                    hint.greyed = false
                });
            }
        }
    }

    function objectifyLevel() : Level {
        return {
            columns: columns,
            rows: rows,
            title: puzzleTitle,
            description: puzzleDescription,
            solutionString: stringifySolution()

        }
    }

    function stringifySolution() : string {
        let str = ""
        
        for (let i = 0; i < solutionGrid.length; i++) {
            if (solutionGrid[i] == "filled") {
                str += "1"
            } else {
                str += "0"
            }
        }

        return str
    }

    function unstringifySolution(str: string) : Array<string> {
        let arr = []

        for (let i = 0; i < str.length; i++) {
            if (str[i] == '1') {
                arr.push("filled")
            } else {
                arr.push("empty")
            }
        }

        return arr
    }

    function saveLevel() {
        savedLevels.push(objectifyLevel())
        savedLevels = savedLevels;
        levelSaved = true
    }

    // Just don't even ask about jank redo
    function loadLevel(level: Level, jankRedo = false) {
        let oldc = columns
        let oldr = rows

        columns = level.columns
        rows = level.rows
        grid = Array(columns*rows).fill("empty")
        puzzleTitle = level.title
        puzzleDescription = level.description
        solutionGrid = unstringifySolution(level.solutionString)

        if ((level.columns != oldc || level.rows != oldr) && jankRedo == false) {
            loadLevel(level, true)
        }
    }

    function onChangeDimensions() {
        solutionGrid = Array(columns*rows).fill("empty")
    }

    function newPuzzle() {
        columns = 10;
        rows = 10;
        grid = Array(columns*rows).fill("empty")
        columnHints = Array(columns).fill([])
        rowHints = Array(rows).fill([])
        solutionGrid = Array(columns*rows).fill("empty")
        puzzleTitle = "Your Title..."
        puzzleDescription = "Your Description..."

        editMode = true;
    }

    function storeLevels() {
        localStorage.levels = JSON.stringify(savedLevels)
        localStorage.downloadCache = JSON.stringify(cachedLevels)
    }

    function uploadLevel() {
        if (uploadsToday > maxUploadsPerDay) {
            return
        }

        let dbRootRef = ref(db);
        let newLevelRef = push(dbRootRef);
        let levelIdRef = ref(db, 'level-ids/' + newLevelRef.key);
        let levelDataRef = ref(db, 'level-data/' + newLevelRef.key);
        set(levelIdRef, '');
        set(levelDataRef, objectifyLevel());

        uploadsToday += 1
        levelUploaded = true
    }

    function getRandomLevel() {
        if (downloadsToday > maxDownloadsPerDay) {
            return
        }
        
        let key = cachedLevels.pop()
        
        get(ref(db, 'level-data/' + key)).then((snapshot) => {
            if (snapshot.exists()) {
                loadLevel(snapshot.val())
            } else {
                console.log("Not getting it.");
            }
        }).catch((error) => {
            console.error(error);
        });

        if (cachedLevels.length == 0) {
            getNewCache()
        }

        downloadsToday += 1;
    }

    function getNewCache() {
        get(ref(db, 'level-ids')).then((snapshot) => {
        if (snapshot.exists()) {
            let val = snapshot.val()
            
            for (let s in val) {
                cachedLevels.push(s)
            }

        } else {
            console.log("Caching gone bad.");
        }
        }).catch((error) => {
        console.error(error);
        });
    }
    

</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="background" on:contextmenu|preventDefault></div>
{#if showHelp}
    <div class="help-popup">
        <div>New to the Picross/Nonogram/Pic-a-Pix/etc. type puzzle? There's plenty of pages explaining it like <a href="https://en.wikipedia.org/wiki/Nonogram">the Wikipedia article intro</a>.</div>
        <div>But what about this website? It's a puzzle creator and sharer! Simply create your puzzle in edit mode (top right button), fill in the title and description and voilà!</div>
        <div>You can now save your puzzle locally or share it online! (there's a limit to uploads...)</div>
        <div>To play user puzzles, click the Download Random Puzzle button.</div>
        <button on:click={() => showHelp = false}>Close</button>
    </div>
{/if}
<div class="sidebar left-sidebar">
    <div class="sidebar-row">
        <div class="page-title"><b>YourNonogram</b>.web.app</div>
        <button class="help-button" on:click={() => showHelp = true}>Help</button>
    </div>
    <div class="sidebar-row">
        <button class="download-button" on:click={getRandomLevel}>Download Random Puzzle</button>
        <button class="create-button" on:click={newPuzzle}>Create New Puzzle</button>
    </div>
    <div><b>Saved Levels</b></div>
    <div class="level-list">
        {#each savedLevels as level, i}
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div>
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div>{level.title}</div>
                <div>{level.columns}x{level.rows}</div>
                <button on:click={() => loadLevel(savedLevels[i])}>Load</button>
                <button on:click={() => {savedLevels.splice(i, 1); savedLevels = savedLevels}}>Delete</button>
            </div>
        {/each}
    </div>
</div>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="board" class:edit-mode={editMode} style="--columns: {columns}; --rows: {rows};" on:contextmenu|preventDefault>
    <div></div>
    {#each {length: columns} as _, i}
        <div class="hint-bar column" class:selected={hoveredCell % columns == i} >
            {#each columnHints[i] as hint}
                <div class:greyed={hint.greyed}>{hint.number}</div>
            {/each}
        </div>
    {/each}
    {#each {length: rows} as _, j}
        <div class="hint-bar row" class:selected={Math.floor(hoveredCell / columns) == j}>
            {#each rowHints[j] as hint}
                <div class:greyed={hint.greyed}>{hint.number}</div>
            {/each}
        </div>
        {#each {length: columns} as _, i}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div class="cell"
            class:vertical-lined-left={i != 0 && i % 5 == 0}
            class:vertical-lined-right={i != columns-1 && (i+1) % 5 == 0}
            class:vertical-lined-top={j != 0 && j % 5 == 0}
            class:vertical-lined-bottom={j != rows-1 && (j+1) % 5 == 0}
            class:filled={grid[i + j*columns] == "filled"} 
            class:crossed={grid[i + j*columns] == "crossed"}
            class:should-be-filled={solutionGrid[i + j*columns] == "filled"}
            on:mousedown|preventDefault={(e) => clickCell(e, i + j*columns)}
            on:mouseenter={() => enterCell(i + j*columns)}
            ></div>
        {/each}
    {/each}
</div>
<div class="sidebar right-sidebar">
    {#if editMode == true}
        <button on:click={() => editMode = false}>Switch to play mode</button>
    {:else}
        <button on:click={() => editMode = true}>Switch to edit mode</button>
    {/if}
    
    <div class="sidebar-row">
        {#if editMode == true}
            <span>
                <select bind:value={columns} on:change={onChangeDimensions}>
                    {#each columnChoices as choice}
                        <option value={choice}>{choice}</option>
                    {/each}
                </select>
                <span>x</span>
                <select bind:value={rows} on:change={onChangeDimensions}>
                    {#each rowChoices as choice}
                        <option value={choice}>{choice}</option>
                    {/each}
                </select>
            </span>
        {:else}
            <span>{columns}x{rows}</span>
        {/if}
    </div>

    {#if editMode == true}
        <input type="text" placeholder="Your title goes here!" bind:value={puzzleTitle} maxlength="50">
        <textarea cols="34" rows="15" placeholder="Your description goes here!" bind:value={puzzleDescription} maxlength="700"></textarea>
    {:else}
        <div>{puzzleTitle}</div>
        <div>{puzzleDescription}</div>
    {/if}
    
    <div class="sidebar-row">
        {#if levelSaved}
            <button class="successful">Saved!</button>
        {:else}
            <button on:click={saveLevel}>Save</button>
        {/if}

        {#if levelUploaded}
            <button class="successful">Uploaded!</button>
        {:else}
            <button on:click={uploadLevel}>Upload</button>
        {/if}


        <!-- <button>Report</button> -->
    </div> 
</div>

<svelte:window on:mouseup={mouseUp} on:mouseenter={() => fillMode = "off"} on:beforeunload={storeLevels}></svelte:window>

<style>
    * {
        font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
    }

    .background {
        width: 100vw;
        height: 100vh;
        z-index: -100;
    }

    .help-popup {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: fit-content;
        height: fit-content;
        z-index: 99;
        background-color: lightblue;
        border-radius: 5px;
        padding: 10px;
    }

    .help-popup > * {
        margin-top: 5px;
    }
    
    .sidebar {
        display: flex;
        flex-direction: column;
        align-items: center;
        height: 100%;
        width: 350px;
        position: absolute;
        top: 0;
        background-color: lightblue;
        gap: 7px;
        padding-top: 7px;
    }

    .left-sidebar {
        left: 0;
    }

    .sidebar-row {
        width: 100%;
        
        display: flex;
        flex-direction: row;
        justify-content: space-around;
    }

    .level-list {
        display: flex;
        flex-direction: column;
        overflow: auto;
        width: 90%;
    }
    
    .level-list > div {
        margin-top: 15px;
    }
    
    .right-sidebar {
        right: 0;
    }
    
    button {
        padding-left: 18px;
        padding-right: 18px;
        min-width: 80px;
        min-height: 25px;
        border: 2px solid rgb(102, 111, 129);
        border-radius: 3px;
    }
    
    button.successful {
        border-color: rgb(255, 255, 255);
        background-color: rgb(83, 212, 235);
        color:rgb(255, 255, 255);
    }

    .board {
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        position: absolute;
        display: grid;
        grid-template-columns: 150px repeat(var(--columns), 30px);
        grid-template-rows: 150px repeat(var(--rows), 30px);
        gap: 0px;
        user-select: none;
    }

    .cell {
        background-color: white;
        outline: 1px solid rgb(34, 34, 34);
    }

    .cell:hover {
        outline: 3px solid rgb(134, 39, 158);
        z-index: 10;
    }

    .vertical-lined-left, .vertical-lined-right, .vertical-lined-top, .vertical-lined-bottom {
        border: 0px solid rgb(255, 96, 96);
    }

    .vertical-lined-left {
        border-left-width: 1px;
    }

    .vertical-lined-right {
        border-right-width: 1px;
    }

    .vertical-lined-top {
        border-top-width: 1px;
    }

    .vertical-lined-bottom {
        border-bottom-width: 1px;
    }

    .hint-bar {
        display: flex;
        background-color: rgb(241, 255, 255);
        outline: 1px solid rgb(34, 34, 34);
        align-items: center;
        justify-content: end;
    }

    .hint-bar.column {
        flex-direction: column;
    }

    .hint-bar.row {
        gap: 5px;
        padding-right: 5px;
    }

    .hint-bar.selected {
        background-color: rgb(253, 252, 178);
    }
    
    :not(.edit-mode) .cell.filled {
        background-color: black;
    }
    
    :not(.edit-mode) .cell.crossed {
        background-color: rgb(248, 221, 229);
        background-image: url('$lib/assets/cross.png');
        background-size: 30px;
        background-repeat:no-repeat;
        background-position: center center; 
    }
    
    .edit-mode .cell {
        background-color: rgb(233, 216, 200);
    }

    .edit-mode .cell.should-be-filled {
        background-color: rgb(24, 129, 228);
    }

    .greyed {
        color: gray;
    }

</style>