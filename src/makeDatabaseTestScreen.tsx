import React, { useState, useEffect, useCallback } from "react";
import { FlatList, ListRenderItem } from "react-native";
import {
  ScreenView,
  ScrollView,
  StyledButton,
  StyledLoader,
  StyledText,
  StyledView,
} from "@dwidge/components-rnw";
import { ApiHooks, ApiRecord } from "@dwidge/crud-api-react";
import { StyledHeader } from "./StyledHeader.js";

export const makeDatabaseTestScreen = <
  T extends ApiRecord & { updatedAt: number; deletedAt: number | null },
>({
  title = "TestItem",
  useApi = () => ({}) as ApiHooks<T>,
  useNavAction = () => (filter: Partial<T>) => {},
  useNavFilter = () => ({}) as Partial<T>,
  randItem = () => ({}) as Partial<T>,
} = {}) => {
  const ListScreen = ({}) => (
    <ScreenView>
      <StyledHeader title={title} />
      <StyledView pad gap flex>
        <StyledText l>{useApi().useCount()}</StyledText>
        <ListView />
      </StyledView>
    </ScreenView>
  );

  const ItemScreen = ({ filter = useNavFilter() }) => (
    <ScreenView>
      <ScrollView>
        <StyledHeader title={title} />
        <StyledView pad gap>
          <ItemView />
        </StyledView>
      </ScrollView>
    </ScreenView>
  );

  const ListView = () => {
    const api = useApi();
    const onPressItem = useNavAction();
    const createItem = api.useCreateItem();
    const deleteItem = api.useDeleteItem();
    const restoreItem = api.useRestoreItem();
    const navFilter = useNavFilter();

    const [data, setData] = useState<T[]>([]);
    const [page, setPage] = useState(0);
    const itemsPerPage = 200; // Adjust as needed
    const [showDeleted, setShowDeleted] = useState(false);
    const toggleDeleted = useCallback(
      () => setShowDeleted(!showDeleted),
      [showDeleted],
    );

    const filter = showDeleted
      ? { ...navFilter, deletedAt: { $not: null } }
      : { ...navFilter, deletedAt: null };

    const list = api.useGetList(filter, {
      limit: itemsPerPage,
      offset: page * itemsPerPage,
      order: [["updatedAt", "DESC"]],
      columns: ["id", "deletedAt"],
    });

    const hasMore = list !== undefined && list.length === itemsPerPage;
    const loading = list === undefined;

    useEffect(() => {
      if (list && page === 0) {
        setData(list as T[]);
      } else if (
        list &&
        page > 0 &&
        data[data.length - 1] !== list[list.length - 1]
      ) {
        setData((prevData) => [...prevData, ...list] as T[]);
      }
    }, [list, data, page]);

    const fetchMoreData = useCallback(() => {
      if (!loading && hasMore) {
        setPage((prevPage) => prevPage + 1);
      }
    }, [loading, hasMore, page]);

    const renderItem: ListRenderItem<T> = useCallback(
      ({ item }) => {
        const isDeleted = item.deletedAt !== null && showDeleted;
        const buttonText = isDeleted ? "Restore" : "Delete";
        const buttonAction = isDeleted
          ? restoreItem && (() => restoreItem(item))
          : deleteItem && (() => deleteItem(item));

        return (
          <StyledView key={"" + item.id} row space>
            <StyledText flex onPress={() => onPressItem(item)}>
              {item.id}
            </StyledText>
            <StyledButton onPress={buttonAction}>{buttonText}</StyledButton>
          </StyledView>
        );
      },
      [deleteItem, restoreItem, onPressItem, showDeleted],
    );

    const keyExtractor = useCallback((item: T) => "" + item.id, []);

    const renderFooter = useCallback(() => {
      if (loading && page > 0) {
        // Show loader only when fetching more
        return (
          <StyledView style={{ paddingVertical: 20 }}>
            <StyledLoader />
          </StyledView>
        );
      }
      return null;
    }, [loading, page]);

    const handleRefresh = useCallback(() => {
      setPage(0);
      setData([]); // Clear existing data while refreshing
    }, []);

    return (
      <StyledView gap flex>
        <StyledButton onPress={toggleDeleted}>
          {showDeleted ? "Deleted" : "Existing"}
        </StyledButton>
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          onEndReached={fetchMoreData}
          onEndReachedThreshold={0.5} // Adjust as needed
          ListFooterComponent={renderFooter}
          ListEmptyComponent={() =>
            loading ? null : <StyledText>No items found.</StyledText>
          }
          refreshing={loading && page === 0} // Only refreshing on initial load
          onRefresh={handleRefresh}
          style={{ flex: 1 }}
        />
        <StyledButton
          onPress={createItem ? () => createItem(randItem()) : undefined}
        >
          Add
        </StyledButton>
      </StyledView>
    );
  };

  const ItemView = ({
    item: [item, setItem] = useApi().useItem(useNavFilter()),
  }) => (
    <StyledView>
      {item ? (
        <StyledText numberOfLines={111}>
          {JSON.stringify(item, null, 2)}
        </StyledText>
      ) : (
        <StyledText>Not Found</StyledText>
      )}
      <StyledButton onPress={setItem && (() => setItem(randItem()))}>
        Random
      </StyledButton>
      <StyledButton onPress={setItem && (() => setItem(null))}>
        Delete
      </StyledButton>
    </StyledView>
  );

  return { ListScreen, ItemScreen };
};
